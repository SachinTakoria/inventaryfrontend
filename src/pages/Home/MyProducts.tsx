// ✅ Full Editable MyProducts.tsx – Clean UI, All Fields from AddProduct.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const MyProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/products/products`);
      setProducts(response.data);
    } catch (error) {
   
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/categories`);
      setCategories(res.data);
    } catch (err) {
    
    }
  };

  const filteredProducts = products.filter((product) =>
    product.productName.toLowerCase().includes(search.toLowerCase()) ||
    product.brand.toLowerCase().includes(search.toLowerCase()) ||
    String(product.price).includes(search)
  );

  const handleDelete = async (productId: string) => {
    const confirmDelete = window.confirm("❌ Do you really want to delete this product?");
    if (!confirmDelete) return;
    try {
      await axios.delete(`${BASE_URL}/products/${productId}`);
      setProducts(products.filter((product) => product._id !== productId));
      alert("✅ Product deleted successfully!");
    } catch (error) {
    
      alert("❌ Failed to delete product. Try again!");
    }
  };

  const handleEdit = (product: any) => {
    setEditProductId(product._id);
    setEditData(product);
  };

  const handleCancelEdit = () => {
    setEditProductId(null);
    setEditData({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: string) => {
    setEditData({ ...editData, [field]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${BASE_URL}/products/products/${editProductId}`, editData);

      setProducts(products.map((product) => product._id === editProductId ? { ...product, ...editData } : product));
      alert("✅ Product updated successfully!");
      setEditProductId(null);
    } catch (error) {
     
      alert("❌ Failed to update product. Try again!");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">📦 My Products</h1>

      <input
        type="text"
        placeholder="🔍 Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-64 p-1 mb-4 border border-gray-300 rounded-md text-sm"
      />

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="p-2 text-left">IMAGE</th>
              <th className="p-2 text-left">NAME</th>
              <th className="p-2 text-left">CATEGORY</th>
              <th className="p-2 text-left">BRAND</th>
              <th className="p-2 text-left">STOCK</th>
              <th className="p-2 text-left">PRICE</th>
              <th className="p-2 text-left">WAREHOUSE</th>
              <th className="p-2 text-left">SUPPLIER</th>
              <th className="p-2 text-left">STATUS</th>
              <th className="p-2 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product._id} className="border-b">
                  <td className="p-2">
                    <img
                      src={product.images ? `${BASE_URL.replace('/api/v1', '')}/${product.images}` : "/no-image.png"}
                      alt={product.productName}
                      className="w-10 h-10 rounded object-cover"
                    />
                  </td>

                  <td className="p-2">
                    {editProductId === product._id ? (
                      <input value={editData.productName} onChange={(e) => handleInputChange(e, "productName")} className="input" />
                    ) : product.productName}
                  </td>

                  <td className="p-2">
                    {editProductId === product._id ? (
                      <select value={editData.category} onChange={(e) => handleInputChange(e, "category")} className="input">
                        {categories.map((cat: any) => (
                          <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    ) : product.category}
                  </td>

                  <td className="p-2">
                    {editProductId === product._id ? (
                      <input value={editData.brand} onChange={(e) => handleInputChange(e, "brand")} className="input" />
                    ) : product.brand}
                  </td>

                  <td className="p-2">
  {product.stock}
  <br />
  <small className="text-xs text-gray-400 italic">
    (auto-updated from purchases & sales)
  </small>
</td>



                  <td className="p-2 font-semibold">
                    {editProductId === product._id ? (
                      <input type="number" value={editData.price} onChange={(e) => handleInputChange(e, "price")} className="input" />
                    ) : `₹ ${product.price}`}
                  </td>

                  <td className="p-2">
                    {editProductId === product._id ? (
                      <input value={editData.warehouse} onChange={(e) => handleInputChange(e, "warehouse")} className="input" />
                    ) : product.warehouse}
                  </td>

                  <td className="p-2">
                    {editProductId === product._id ? (
                      <input value={editData.supplier} onChange={(e) => handleInputChange(e, "supplier")} className="input" />
                    ) : product.supplier}
                  </td>

                  <td className="p-2">
                    {editProductId === product._id ? (
                      <select value={editData.status} onChange={(e) => handleInputChange(e, "status")} className="input">
                        <option value="Received">Received</option>
                        <option value="Pending">Pending</option>
                      </select>
                    ) : product.status}
                  </td>

                  <td className="p-2 text-center">
                    {editProductId === product._id ? (
                      <>
                        <button className="text-green-600 hover:text-green-800 mr-2" onClick={handleUpdate}><FaCheck /></button>
                        <button className="text-red-600 hover:text-red-800" onClick={handleCancelEdit}><FaTimes /></button>
                      </>
                    ) : (
                      <>
                        <button className="text-blue-600 hover:text-blue-800 mr-2" onClick={() => handleEdit(product)}><FaEdit /></button>
                        <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(product._id)}><FaTrash /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={10} className="text-center p-4">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyProducts;
