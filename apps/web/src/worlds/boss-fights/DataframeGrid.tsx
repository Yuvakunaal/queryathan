import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { ColumnHints } from "@dcq/content-schema";
import { formatCellValue } from "./formatCellValue";
import { afflictionKindAt } from "../../lib/affliction-cells";
import type { AfflictionKind } from "../../lib/affliction-cells";
import { ariaLabelForAffliction, BADGE_GLYPH } from "./afflictionPresentation";
import { classNames } from "../../lib/classNames";
import styles from "./DataframeGrid.module.css";

const ROW_HEIGHT_PX = 28;
const OVERSCAN = 8;
const DEFAULT_COLUMN_WIDTH = 110;

type CSSVarStyle = CSSProperties & Record<`--${string}`, string | number>;

export interface DataframeGridHandle {
  /** Returns the .cell element for (rowIndex, column), or null if not currently mounted (off-screen). */
  getCellElement(rowIndex: number, column: string): HTMLElement | null;
}

export interface DataframeGridProps {
  grid: ResultGrid;
  /** Every currently-afflicted cell, keyed and looked up via affliction-cells.ts helpers — one win condition can stack multiple affliction kinds at once (Phase 2 spec §2). */
  afflictionCellMap: Map<string, AfflictionKind>;
  /** Mirrors --dcq-text-scale (spec §2.1) — row height must track it exactly. */
  textScale: number;
  /** Per-column display hints from the case JSON; a column with no hint falls back to sane defaults. */
  columnHints?: ColumnHints | undefined;
}

const DataframeGrid = forwardRef<DataframeGridHandle, DataframeGridProps>(
  function DataframeGrid({ grid, afflictionCellMap, textScale, columnHints }, ref) {
    const scrollRef = useRef<HTMLDivElement>(null);
    // Roving tabindex (spec §3.6): exactly one cell is tab-stoppable at a
    // time; arrow keys move it and re-focus the new target.
    const [focusedCell, setFocusedCell] = useState({ rowIndex: 0, columnIndex: 0 });
    const pendingFocusRef = useRef(false);

    const rowHeightPx = Math.round(ROW_HEIGHT_PX * textScale);

    const virtualizer = useVirtualizer({
      count: grid.rows.length,
      getScrollElement: () => scrollRef.current,
      estimateSize: () => rowHeightPx,
      overscan: OVERSCAN,
    });

    // estimateSize seeds the cache once; a later text-scale change needs an
    // explicit re-measure or previously-cached rows keep their old pixel
    // height while the CSS line-height inside them grows, clipping text.
    useEffect(() => {
      virtualizer.measure();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- virtualizer itself is stable; rowHeightPx is the real trigger
    }, [rowHeightPx]);

    useImperativeHandle(
      ref,
      () => ({
        getCellElement(rowIndex, column) {
          return (
            scrollRef.current?.querySelector<HTMLElement>(
              `[data-row-index="${String(rowIndex)}"][data-column="${column}"]`,
            ) ?? null
          );
        },
      }),
      [],
    );

    // Focus follows the roving tabindex after a keyboard move — wait for the
    // virtualizer to mount the target row (it may have just scrolled into view).
    useEffect(() => {
      if (!pendingFocusRef.current) return;
      pendingFocusRef.current = false;
      const column = grid.columns[focusedCell.columnIndex];
      if (!column) return;
      const el = scrollRef.current?.querySelector<HTMLElement>(
        `[data-row-index="${String(focusedCell.rowIndex)}"][data-column="${column}"]`,
      );
      el?.focus();
    }, [focusedCell, grid.columns]);

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
      let { rowIndex, columnIndex } = focusedCell;
      switch (event.key) {
        case "ArrowDown":
          rowIndex = Math.min(grid.rows.length - 1, rowIndex + 1);
          break;
        case "ArrowUp":
          rowIndex = Math.max(0, rowIndex - 1);
          break;
        case "ArrowRight":
          columnIndex = Math.min(grid.columns.length - 1, columnIndex + 1);
          break;
        case "ArrowLeft":
          columnIndex = Math.max(0, columnIndex - 1);
          break;
        default:
          return;
      }
      event.preventDefault();
      pendingFocusRef.current = true;
      setFocusedCell({ rowIndex, columnIndex });
      virtualizer.scrollToIndex(rowIndex, { align: "auto" });
    }

    const items = virtualizer.getVirtualItems();

    // A hint can be narrower than the column's own name once it is shown in
    // capitals with letter-spacing, so the name sets a floor.
    function columnWidth(column: string): number {
      const hinted = columnHints?.[column]?.widthPx ?? DEFAULT_COLUMN_WIDTH;
      return Math.max(hinted, Math.ceil(column.length * 9.5 * textScale) + 28);
    }
    function isNumericColumn(column: string): boolean {
      return columnHints?.[column]?.numeric ?? false;
    }

    return (
      <div
        className={styles.gridScroll}
        ref={scrollRef}
        role="grid"
        aria-rowcount={grid.rows.length}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.headerRow} role="row">
          <div
            className={styles.indexHeaderCell}
            role="columnheader"
            aria-hidden="true"
          />
          {grid.columns.map((column) => (
            <div
              key={column}
              className={styles.headerCell}
              role="columnheader"
              style={{ width: columnWidth(column) }}
            >
              {column}
            </div>
          ))}
        </div>
        <div
          className={styles.body}
          role="rowgroup"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {items.map((item) => {
            const row = grid.rows[item.index];
            if (!row) return null;
            const isLedgerRow = (item.index + 1) % 5 === 0;

            return (
              <div
                key={item.key}
                className={classNames(
                  styles.row,
                  item.index % 2 === 0 ? styles.rowA : styles.rowB,
                  isLedgerRow && styles.ledger,
                )}
                role="row"
                aria-rowindex={item.index + 1}
                style={{
                  height: item.size,
                  transform: `translateY(${String(item.start)}px)`,
                }}
                data-index={item.index}
                ref={virtualizer.measureElement}
              >
                <div className={styles.indexCell} role="gridcell" aria-hidden="true">
                  {item.index}
                </div>
                {grid.columns.map((column, columnIndex) => {
                  const value = row[column];
                  const kind = afflictionKindAt(afflictionCellMap, item.index, column);
                  const isRoving =
                    item.index === focusedCell.rowIndex &&
                    columnIndex === focusedCell.columnIndex;
                  return (
                    <div
                      key={column}
                      className={classNames(
                        styles.cell,
                        isNumericColumn(column) && styles.numeric,
                      )}
                      role="gridcell"
                      tabIndex={isRoving ? 0 : -1}
                      style={
                        {
                          width: columnWidth(column),
                          "--w1-cell-seed": item.index % 16,
                        } as CSSVarStyle
                      }
                      data-row-index={item.index}
                      data-column={column}
                      data-affliction={kind}
                      aria-label={
                        kind
                          ? ariaLabelForAffliction(
                              kind,
                              column,
                              item.index,
                              value ?? null,
                            )
                          : undefined
                      }
                    >
                      {kind && kind !== "null" ? (
                        <span className={styles.afflictionBadge} aria-hidden="true">
                          {BADGE_GLYPH[kind]}
                        </span>
                      ) : null}
                      <span className={styles.diffGutter} data-role="gutter" />
                      <span className={styles.diffOld} data-role="old" />
                      <span className={styles.diffNew} data-role="new">
                        {formatCellValue(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

export default DataframeGrid;
