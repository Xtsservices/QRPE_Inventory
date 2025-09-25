module.exports = {

  CREATE_ITEM: `
    INSERT INTO item_master
    (name, type, cost, status_id, unit)
    VALUES (?, ?, ?, ?, ?)
  `,

  GET_ALL_ITEMS: `
    SELECT 
    i.item_id,
    i.name,
    i.\`type\` AS type,
    i.quantity,
    i.units,
    CONCAT(i.quantity, i.units) AS quantity_with_unit,
    i.cost,
    i.status_id,
    CASE 
      WHEN i.status_id = 1 THEN 'Active'
      ELSE 'Inactive'
    END AS status
  FROM item_master i
  WHERE i.is_deleted = 0
  ORDER BY i.created_at DESC;
`,

  GET_ITEM_BY_ID: `
  SELECT 
    i.item_id,
    i.name,
    i.\`type\` AS type,
    i.quantity,
    i.units,
    CONCAT(i.quantity, i.units) AS quantity_with_unit,
    i.cost,
    i.status_id,
    CASE 
      WHEN i.status_id = 1 THEN 'Active'
      ELSE 'Inactive'
    END AS status
  FROM item_master i
  WHERE i.item_id = ? AND i.is_deleted = 0;
`,

  UPDATE_ITEM: (updateFields) => `
    UPDATE item_master
    SET ${updateFields.join(", ")}, updated_at = NOW()
    WHERE item_id = ?
  `,

  SOFT_DELETE_ITEM: `
    UPDATE item_master
    SET status_id = 2, updated_at = NOW()
    WHERE item_id = ?
  `,
};
