# El Jardín de los Recuerdos

Juego móvil *cozy* de farmeo, misterio e investigación. Prototipo web (MVP) basado en el GDD v3.0.

## Estado actual

**MVP — Hito 01 "La Primera Flor"** + **núcleo de criaturas (GDD v3.0)**:

- Entrar al jardín con **narrativa de introducción** (la casa, "seis años", la flor)
- Tocar flores y obtener pétalos
- Convertir 10 pétalos en 1 ramo (conservando excedentes)
- Comprar mejoras en la tienda
- **Sistema de criaturas**: Nilo aparece, roba flores, 3 taps para detenerlo
  (o escapa y roba pétalos). Cada intervención avanza la investigación.
- **Investigación** → comprar **jaula** → **captura** (jaula vinculada a la criatura)
- **Alimento favorito** → **domesticación** (minijuego 10 taps / 5 s)
- **Compañero**: Nilo recolecta pétalos extra y restaura una **memoria** narrativa
- Diario con fichas de criatura (estado, confianza, captura) y recuerdos
- Guardado persistente (localStorage) + guardado automático + persistencia
- Ciclo día/noche (controlado) y diario ampliado

## Estructura

La arquitectura sigue el GDD técnico:

```
SCENES  →  UI  →  SYSTEMS  →  DATA
```

- `src/data/` — contenido (flores, criaturas, jaulas, alimentos, compañeros,
  mejoras, mapas, memorias, historia...)
- `src/systems/` — lógica (economía, guardado, farmeo, recompensas, event bus,
  criaturas, captura, domesticación, compañeros, memoria, narrativa...)
- `src/scenes/` — pantallas (jardín, mapa, diario, tienda, ajustes...)
- `src/ui/` — componentes (top bar, notificaciones, diálogo narrativo, ficha de
  criatura, minijuego de domesticación, diario...)
- `src/entities/` — entidades (flor, criatura, jugador, interactuable)
- `src/utils/` — utilidades (azar, tiempo, validación, almacenamiento)

## Cómo ejecutar

El prototipo usa módulos ES nativos, así que debe servirse por HTTP
(no abrir `index.html` directamente). El juego tiene un **nombre de host
local propio**: `jardin.local`.

**Forma más sencilla:** haz doble clic en `abrir-jardin.bat`. Arranca el
servidor y abre el navegador en **http://jardin.local**

También puede iniciarse manualmente:

```bash
node static.cjs        # escucha en http://jardin.local (puerto 80)
```

> `jardin.local` se mapea a `127.0.0.1` en el archivo `hosts` de Windows
> (script `add-hosts.ps1`, requiere administrador). Si el puerto 80 está
> ocupado, el servidor cae al puerto 8123 de respaldo:
> `http://jardin.local:8123`

Opción con depuración activa (puedes añadir recursos en Ajustes):

```
http://jardin.local/index.html?debug=1
```

## Pruebas automáticas

El núcleo del juego se valida con Chrome headless contra una sesión de
depuración remota (CDP):

```bash
node test_v3.cjs <puerto-cdp>     # ciclo completo de criaturas (Nilo)
node test_mvp.cjs <puerto-cdp>    # regresión del MVP base
```

El navegador debe lanzarse con `--remote-debugging-port=9333`, por ejemplo:

```
chrome --headless=new --remote-debugging-port=9333 --user-data-dir=<tmp> about:blank
```

`test_v3.cjs` verifica de punta a punta: introducción narrativa, tap → pétalos,
anomalía → encuentro de Nilo, 3 taps para detenerlo, investigación, compra de
jaula, captura, alimento, domesticación → compañero, memoria y persistencia.
`test_mvp.cjs` verifica la economía base (conversión, tienda, guardado).

## Orden de implementación (GDD §93)

Config → Boot → Preload → GameState → SaveSystem → EconomySystem → FlowerSystem →
FarmingSystem → GardenScene → ...
```
