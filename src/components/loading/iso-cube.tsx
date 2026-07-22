"use client";

import { useMemo } from "react";
import styles from "./iso-cube.module.css";

type CubeCell = {
  dx: number;
  dy: number;
  delay: number;
};

function buildCells(): CubeCell[] {
  const cells: CubeCell[] = [];

  for (let h = 1; h <= 3; h += 1) {
    for (let w = 1; w <= 3; w += 1) {
      for (let l = 1; l <= 3; l += 1) {
        const dx = 43 * (l - w);
        const dy = 100 * (0.5 * h + 0.25 * w + 0.25 * l) - 200;
        const delay = ((h + w + l - 3) / 6) * 1.4;
        cells.push({ dx, dy, delay });
      }
    }
  }

  return cells;
}

export function IsoCube({ scale = 0.62 }: { scale?: number }) {
  const cells = useMemo(buildCells, []);

  return (
    <div className={styles.wrap} style={{ transform: `scale(${scale})` }}>
      {cells.map((cell, index) => (
        <div key={`${cell.dx}-${cell.dy}-${index}`} className={styles.slot} style={{ transform: `translate(${cell.dx}px, ${cell.dy}px)` }}>
          <div
            className={styles.cube}
            style={{
              "--dx": `${cell.dx}px`,
              "--dy": `${cell.dy}px`,
              "--delay": `${cell.delay}s`,
            } as React.CSSProperties}
          >
            <div className={`${styles.face} ${styles.top}`} />
            <div className={`${styles.face} ${styles.left}`} />
            <div className={`${styles.face} ${styles.right}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
