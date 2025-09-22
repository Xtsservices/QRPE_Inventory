module.exports = {
  CREATE_ITEM: `
    INSERT INTO item_master
    (name, type, unit, quantities, cost, status_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `,

  GET_ALL_ITEMS: `
    SELECT * FROM item_master
  `,

  GET_ITEM_BY_ID: `
    SELECT * FROM item_master WHERE item_id = ?
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
