import { StrictMode, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import plantsData from "../public/data/posters.json";
import zombie1 from "../public/data/zombie/zombie1.gif";
import zombie2 from "../public/data/zombie/zombie2.gif";
import zombie3 from "../public/data/zombie/zombie3.gif";
import zombie4 from "../public/data/zombie/zombie4.gif";
import "./main.css";

const GRID_ROWS = 5;
const GRID_COLUMNS = 9;
const GRID_SIZE = GRID_ROWS * GRID_COLUMNS;
const MAX_PLANTS = 10;
const ZOMBIES = [
  { id: "zombie-1", name: "Walker", image: zombie1 },
  { id: "zombie-2", name: "Buckethead", image: zombie2 },
  { id: "zombie-3", name: "Conehead", image: zombie3 },
  { id: "zombie-4", name: "Flag Zombie", image: zombie4 }
];

function App() {
  const idRef = useRef(0);
  const [bench, setBench] = useState([]);
  const [grid, setGrid] = useState(() => Array(GRID_SIZE).fill(null));
  const [dragItem, setDragItem] = useState(null);
  const [showZombie, setShowZombie] = useState(false);

  const totalPlaced = useMemo(
    () => grid.filter(Boolean).length,
    [grid]
  );

  const totalCreated = bench.length + totalPlaced;
  const remainingQuota = Math.max(0, MAX_PLANTS - totalCreated);
  const canGenerateMore = remainingQuota > 0;
  const readyEnabled = totalPlaced === MAX_PLANTS;

  const createInstance = plant => ({
    ...plant,
    instanceId: `${plant.id}-${idRef.current++}`
  });

  const handleGenerate = () => {
    if (!canGenerateMore) {
      return;
    }
    const randomIndex = Math.floor(Math.random() * plantsData.length);
    const instance = createInstance(plantsData[randomIndex]);
    setBench(prev => [...prev, instance]);
  };

  const handleDragStart = (source, index) => event => {
    const plant = source === "bench" ? bench[index] : grid[index];
    if (!plant) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", plant.instanceId);
    setDragItem({ source, index, plant });
  };

  const handleDragEnd = () => {
    setDragItem(null);
  };

  const handleDropToGrid = index => event => {
    event.preventDefault();
    if (!dragItem) {
      return;
    }

    setGrid(prevGrid => {
      const nextGrid = [...prevGrid];
      const targetPlant = nextGrid[index];

      if (dragItem.source === "bench") {
        const movingPlant = dragItem.plant;

        setBench(prevBench => {
          const updatedBench = prevBench.filter(
            item => item.instanceId !== movingPlant.instanceId
          );
          if (targetPlant) {
            updatedBench.push(targetPlant);
          }
          return updatedBench;
        });

        nextGrid[index] = movingPlant;
      } else {
        if (dragItem.index === index) {
          return prevGrid;
        }

        const movingPlant = prevGrid[dragItem.index];
        if (!movingPlant) {
          return prevGrid;
        }

        nextGrid[dragItem.index] = targetPlant ?? null;
        nextGrid[index] = movingPlant;
      }

      return nextGrid;
    });

    setDragItem(null);
  };

  const handleDropToBench = event => {
    event.preventDefault();

    if (!dragItem || dragItem.source !== "grid") {
      return;
    }

    setGrid(prevGrid => {
      const nextGrid = [...prevGrid];
      const movingPlant = nextGrid[dragItem.index];

      if (!movingPlant) {
        return prevGrid;
      }

      nextGrid[dragItem.index] = null;

      setBench(prevBench => [...prevBench, movingPlant]);

      return nextGrid;
    });

    setDragItem(null);
  };

  const handleReady = () => {
    if (!readyEnabled) {
      return;
    }
    setShowZombie(true);
  };

  return (
    <div className="app">
      {!showZombie && (
        <header className="app__header">
          <h1>Plants vs Zombies Stimulator </h1>
          <p></p>
          <dl className="app__stats">
            <div>
              <dt>Drawn</dt>
              <dd>{totalCreated}</dd>
            </div>
            <div>
              <dt>On Field</dt>
              <dd>{totalPlaced}</dd>
            </div>
            <div>
              <dt>Slots Left</dt>
              <dd>{remainingQuota}</dd>
            </div>
          </dl>
        </header>
      )}

      <main className="playfield">
        <section className="lawn" role="grid" aria-label="Lawn grid with 5 rows and 9 columns">
          {grid.map((plant, index) => {
            const row = Math.floor(index / GRID_COLUMNS) + 1;
            const col = (index % GRID_COLUMNS) + 1;

            return (
              <div
                key={index}
                className={`cell${plant ? " cell--occupied" : ""}`}
                onDragOver={event => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={handleDropToGrid(index)}
                role="gridcell"
                aria-label={`Row ${row}, Column ${col}`}
              >
                {plant ? (
                  <PlantFigure
                    plant={plant}
                    draggable
                    onDragStart={handleDragStart("grid", index)}
                    onDragEnd={handleDragEnd}
                  />
                ) : null}
              </div>
            );
          })}
        </section>

        {!showZombie && (
          <aside className="control-panel" aria-label="Control panel">
            <section className="generator">
              <h2>Random Plants</h2>
              <p>Up to {MAX_PLANTS} pulls, duplicates are possible.</p>
              <button
                type="button"
                className="generator__button"
                onClick={handleGenerate}
                disabled={!canGenerateMore}
              >
                {canGenerateMore ? "Draw Plant" : "Limit Reached"}
              </button>
            </section>

            <section
              className={`bench${dragItem?.source === "grid" ? " bench--target" : ""}`}
              aria-label="Bench area"
              onDragOver={event => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={handleDropToBench}
            >
              <h2>Bench</h2>
              {bench.length === 0 ? (
                <p className="bench__empty">No benched plants yet.</p>
              ) : (
                <ul className="bench__list">
                  {bench.map((plant, index) => (
                    <li key={plant.instanceId}>
                      <PlantFigure
                        plant={plant}
                        draggable
                        onDragStart={handleDragStart("bench", index)}
                        onDragEnd={handleDragEnd}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        )}
      </main>

      {!showZombie && (
        <button
          type="button"
          className="ready-button"
          onClick={handleReady}
          disabled={!readyEnabled}
        >
          Ready!
        </button>
      )}

      {showZombie && <ZombieLane zombies={ZOMBIES} />}
    </div>
  );
}

function PlantFigure({ plant, draggable, onDragStart, onDragEnd }) {
  return (
    <article
      className="plant"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <img src={plant.image} alt={plant.name} />
      <div className="plant__details">
        <h3>{plant.name}</h3>
        <p>{plant.role}</p>
      </div>
    </article>
  );
}

function ZombieLane({ zombies }) {
  return (
    <div className="zombie-lane" role="complementary" aria-label="Zombies approaching">
      <div className="zombie-lane__images">
        {zombies.map(zombie => (
          <img key={zombie.id} src={zombie.image} alt={zombie.name} />
        ))}
      </div>
    </div>
  );
}

const container = document.getElementById("main");
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
