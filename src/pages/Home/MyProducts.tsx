import { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa"; // ✅ Added Icons

const MyProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  // ✅ Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/products/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);


 // ✅ Filtered Products for Search (Name + Brand + Price)
const filteredProducts = products.filter((product) =>
  product.productName.toLowerCase().includes(search.toLowerCase()) ||
  product.brand.toLowerCase().includes(search.toLowerCase()) ||
  String(product.price).includes(search) // ✅ Price ko string me convert kiya
);


  // ✅ Delete Product Function
  const handleDelete = async (productId: string) => {
    const confirmDelete = window.confirm("❌ Do you really want to delete this product?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:8000/api/v1/products/${productId}`);
      setProducts(products.filter((product) => product._id !== productId));
      alert("✅ Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("❌ Failed to delete product. Try again!");
    }
  };

  // ✅ Edit Product
  const handleEdit = (product: any) => {
    setEditProductId(product._id);
    setEditData(product);
  };

  // ✅ Cancel Edit
  const handleCancelEdit = () => {
    setEditProductId(null);
    setEditData({});
  };

  // ✅ Handle Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setEditData({ ...editData, [field]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:8000/api/v1/products/products/${editProductId}`, editData);
      setProducts(
        products.map((product) =>
          product._id === editProductId ? { ...product, ...editData } : product
        )
      );
      alert("✅ Product updated successfully!");
      setEditProductId(null);
    } catch (error) {
      console.error("Error updating product:", error);
      alert("❌ Failed to update product. Try again!");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">📦 My Products</h1>

      {/* ✅ Search Box */}
      <input
        type="text"
        placeholder="🔍 Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-64 p-1 mb-4 border border-gray-300 rounded-md text-sm"
      />

      {/* ✅ Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-200 text-gray-700 text-sm">
            <tr>
              <th className="p-2 text-left">PRODUCT</th>
              <th className="p-2 text-left">NAME</th>
              <th className="p-2 text-left">BRAND</th>
              <th className="p-2 text-left">PRICE</th>
              <th className="p-2 text-left">IN STOCK</th>
              <th className="p-2 text-left">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
          {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product._id} className="border-b text-sm">
                  {/* ✅ Image Handling */}
                  <td className="p-2">
                    <img
                      src={product.images?.length > 0 ? `http://localhost:8000/${product.images[0]}` : "/no-image.png"}
                      alt={product.productName || "Product Image"}
                      className="w-10 h-10 rounded-md object-cover"
                    />
                  </td>
                  
                  {/* ✅ Editable Fields */}
                  <td className="p-2">
                    {editProductId === product._id ? (
                      <input
                        type="text"
                        value={editData.productName}
                        onChange={(e) => handleInputChange(e, "productName")}
                        className="border border-gray-300 rounded-md p-1 w-full"
                      />
                    ) : (
                      product.productName
                    )}
                  </td>

                  <td className="p-2">
                    {editProductId === product._id ? (
                      <input
                        type="text"
                        value={editData.brand}
                        onChange={(e) => handleInputChange(e, "brand")}
                        className="border border-gray-300 rounded-md p-1 w-full"
                      />
                    ) : (
                      product.brand
                    )}
                  </td>

                  <td className="p-2 font-semibold text-gray-800">
                    {editProductId === product._id ? (
                      <input
                        type="number"
                        value={editData.price}
                        onChange={(e) => handleInputChange(e, "price")}
                        className="border border-gray-300 rounded-md p-1 w-full"
                      />
                    ) : (
                      `₹ ${product.price}`
                    )}
                  </td>

                  <td className="p-2 font-semibold">
                    {editProductId === product._id ? (
                      <input
                        type="number"
                        value={editData.stock}
                        onChange={(e) => handleInputChange(e, "stock")}
                        className="border border-gray-300 rounded-md p-1 w-full"
                      />
                    ) : (
                      product.stock
                    )}
                  </td>

                  {/* ✅ Action Buttons */}
                  <td className="p-2 text-center flex items-center justify-center gap-2">
                    {editProductId === product._id ? (
                      <>
                        <button
                          className="text-green-600 hover:text-green-800"
                          onClick={handleUpdate}
                        >
                          <FaCheck className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={handleCancelEdit}
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleEdit(product)}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(product._id)}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No products available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyProducts;
