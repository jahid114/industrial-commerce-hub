## Plan: Remove Incoming & Reorder Columns from Inventory Table

### Scope
Only the **Overview** inventory table in `src/routes/admin.inventory.tsx` needs changes. The underlying store fields (`incoming`, `reorderLevel`) remain in place because the "Low" / "Out" status logic still depends on `reorderLevel`.

### Changes
1. **Remove table headers** — delete the `<th>Incoming</th>` and `<th>Reorder</th>` cells from the overview table header.
2. **Remove table data cells** — delete the corresponding `<td>` cells that render `r.incoming` and `r.reorderLevel` in each row.
3. **Update empty-state `colSpan`** — reduce the `colSpan` on the "No products match your search" row from `11` to `9` to match the new column count.
4. **Clean up row derivation** — remove `incoming` and `reorderLevel` from the `rows` memo if they become unused (they may still be referenced by status calculation, so verify before removing).

### Out of scope
- The **Movements** tab and its `Δ Incoming` column are untouched.
- The inventory store (`src/lib/inventory-store.tsx`) is untouched.
- Other routes/panels are untouched.
