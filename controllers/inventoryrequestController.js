// controllers/inventoryRequestController.js

let requests = [];
let requestIdCounter = 1;

// CREATE request
exports.createRequest = async (req, res) => {
  try {
    const { requestedBy, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Items are required and must be a non-empty array" });
    }

    let totalPrice = 0;
    let itemCount = 0;

    for (let item of items) {
      totalPrice += item.price * item.quantity;
      itemCount += item.quantity;
    }

    const request = {
      id: requestIdCounter++,
      requested_by: requestedBy,
      total_price: totalPrice,
      item_count: itemCount,
      request_date: new Date(),
      items: items.map((item, idx) => ({
        id: idx + 1,
        item_name: item.itemName,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    requests.push(request);

    res.status(201).json({ message: "Inventory request created", request });
  } catch (error) {
    console.error("Error in createRequest:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// GET all requests
exports.getRequests = async (req, res) => {
  try {
    res.json(requests);
  } catch (error) {
    console.error("Error in getRequests:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// GET single request
exports.getRequestById = async (req, res) => {
  try {
    const request = requests.find((r) => r.id === parseInt(req.params.id));
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json(request);
  } catch (error) {
    console.error("Error in getRequestById:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// UPDATE request
exports.updateRequest = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const request = requests.find((r) => r.id === id);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const { requestedBy, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Items are required and must be a non-empty array" });
    }

    let totalPrice = 0;
    let itemCount = 0;

    for (let item of items) {
      totalPrice += item.price * item.quantity;
      itemCount += item.quantity;
    }

    // Update fields
    request.requested_by = requestedBy || request.requested_by;
    request.items = items.map((item, idx) => ({
      id: idx + 1,
      item_name: item.itemName,
      quantity: item.quantity,
      price: item.price,
    }));
    request.total_price = totalPrice;
    request.item_count = itemCount;

    res.json({ message: "Request updated", request });
  } catch (error) {
    console.error("Error in updateRequest:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// DELETE request
exports.deleteRequest = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Request not found" });
    }

    requests.splice(index, 1);
    res.json({ message: "Request deleted" });
  } catch (error) {
    console.error("Error in deleteRequest:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};
