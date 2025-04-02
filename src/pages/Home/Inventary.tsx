// ✅ Final Cleaned + Enhanced Inventory Page (no toggle issues, sorted, and stable)

import { useEffect, useState } from "react";
import axios from "axios";

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState({});
  const [newPurchase, setNewPurchase] = useState({
    supplier: "",
    quantity: 0,
    price: 0,
    date: "",
    remark: ""
  });
  const [addingFor, setAddingFor] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/products/products`
      );
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const fetchPurchaseHistory = async (productId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/purchases/product/${productId}`
      );
      const sorted = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPurchaseHistory((prev) => ({ ...prev, [productId]: sorted }));
    } catch (err) {
      console.error("Failed to fetch purchase history", err);
    }
  };

  const toggleExpand = async (productId) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
    } else {
      setExpandedProductId(productId);
      await fetchPurchaseHistory(productId);
    }
  };

  const handleChange = (e) => {
    setNewPurchase({ ...newPurchase, [e.target.name]: e.target.value });
  };

  const handleAddPurchase = async (productId) => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/purchases`, {
        ...newPurchase,
        product: productId
      });
      setNewPurchase({ supplier: "", quantity: 0, price: 0, date: "", remark: "" });
      setAddingFor(null);
      await fetchProducts();
      await fetchPurchaseHistory(productId);
    } catch (err) {
      console.error("Failed to add purchase", err);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold text-gray-700 mb-4">📦 Inventory Overview</h1>
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
            <th className="p-2">Image</th>
            <th className="p-2">Name</th>
            <th className="p-2">Category</th>
            <th className="p-2">Stock</th>
            <th className="p-2">Avg Price</th>
            <th className="p-2">Last Updated</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <>
              <tr key={product._id} className="border-b hover:bg-gray-50">
                <td><img src={product.image} className="w-10 h-10 rounded object-cover" /></td>
                <td>{product.productName}</td>
                <td>{product.category}</td>
                <td>{product.stock}</td>
                <td>₹{product.avgPurchasePrice || "0.00"}</td>
                <td>{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : "-"}</td>
                <td>
                  <button
                    onClick={() => toggleExpand(product._id)}
                    className="text-blue-600 hover:underline"
                  >
                    {expandedProductId === product._id ? "Hide" : "View"}
                  </button>
                </td>
              </tr>

              {expandedProductId === product._id && (
                <tr className="bg-gray-50">
                  <td colSpan={7} className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Purchase History</h3>
                    <table className="min-w-full text-sm mb-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2">Supplier</th>
                          <th className="p-2">Quantity</th>
                          <th className="p-2">Price</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseHistory[product._id]?.map((purchase) => (
                          <tr key={purchase._id}>
                            <td className="p-2">{purchase.supplier}</td>
                            <td className="p-2">{purchase.quantity}</td>
                            <td className="p-2">₹{purchase.price}</td>
                            <td className="p-2">{new Date(purchase.date).toLocaleDateString()}</td>
                            <td className="p-2">{purchase.remark || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {addingFor === product._id ? (
                      <div className="space-y-2">
                        <input name="supplier" value={newPurchase.supplier} onChange={handleChange} placeholder="Supplier" className="border p-1 text-sm" />
                        <input name="quantity" type="number" value={newPurchase.quantity} onChange={handleChange} placeholder="Qty" className="border p-1 text-sm" />
                        <input name="price" type="number" value={newPurchase.price} onChange={handleChange} placeholder="Price" className="border p-1 text-sm" />
                        <input name="date" type="date" value={newPurchase.date} onChange={handleChange} className="border p-1 text-sm" />
                        <input name="remark" value={newPurchase.remark} onChange={handleChange} placeholder="Remark" className="border p-1 text-sm" />
                        <div>
                          <button onClick={() => handleAddPurchase(product._id)} className="bg-green-600 text-white px-2 py-1 text-sm rounded">Save</button>
                          <button onClick={() => setAddingFor(null)} className="ml-2 text-red-500 text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingFor(product._id)} className="text-sm text-blue-500 underline">+ Add Purchase</button>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Inventory;
