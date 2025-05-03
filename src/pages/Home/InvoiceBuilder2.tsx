import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { usePDF } from "react-to-pdf";
import moment from "moment";
import { toWords } from "number-to-words";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
import { useSelector } from "react-redux";

type EditableItem = {
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  hsn: string;
  _id: string;
  discount?: number;
};

const InvoiceBuilder2: React.FC = () => {
  const { toPDF, targetRef } = usePDF();
  const [withGST, setWithGST] = useState(true);

  const [gstRate, setGstRate] = useState(5);

  const [bgColor, setBgColor] = useState("white");

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGST, setCustomerGST] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [editableItems, setEditableItems] = useState<EditableItem[]>([
    { name: "", price: 0, quantity: 1, totalPrice: 0, hsn: "", _id: "" },
  ]);
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [previousPending, setPreviousPending] = useState(0);
  const [oldPendingAdjusted, setOldPendingAdjusted] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [orderData, setOrderData] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date()); // NEW STATE

  const [discountPercent, setDiscountPercent] = useState(0);
  const [consignees, setConsignees] = useState<any[]>([]);
  const [selectedConsignee, setSelectedConsignee] = useState<any>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newConsignee, setNewConsignee] = useState({
    name: "",
    address: "",
    gstin: "",
    pan: "",
    state: "",
  });

  const user = useSelector((state: any) => state.user?.currentUser);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/products/products`);

        const result = await response.json();
        setAllProducts(result);
      } catch (error) {}
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchPreviousPending = async () => {
      if (!customerPhone) return;

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${BASE_URL}/orders/pending?phone=${customerPhone}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        setPreviousPending(data?.pendingAmount || 0);
      } catch (error) {
        setPreviousPending(0); // fallback
      }
    };

    fetchPreviousPending();
  }, [customerPhone]);

  useEffect(() => {
    const fetchConsignees = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/consignees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConsignees(data.consignees || []);
    };
    fetchConsignees();
  }, []);

  const handleProductNameChange = (index: number, value: string) => {
    const updatedItems = [...editableItems];
    updatedItems[index].name = value;
    updatedItems[index]._id = "";

    setEditableItems(updatedItems);

    if (value.length > 0) {
      const filtered = allProducts.filter((p) =>
        p.productName.toLowerCase().includes(value.toLowerCase())
      );
      setProductSuggestions(filtered);
    } else {
      setProductSuggestions([]);
    }
  };

  const handleSuggestionSelect = (index: number, product: any) => {
    const updatedItems = [...editableItems];
    updatedItems[index].name = product.productName;
    updatedItems[index].price = product.price;
    updatedItems[index].quantity = 1;
    updatedItems[index].totalPrice = product.price * 1;
    updatedItems[index].hsn = product.hsn || ""; // ✅ ADD THIS LINE
    updatedItems[index]._id = product._id;

    setEditableItems(updatedItems);
    setProductSuggestions([]);

    if (index === editableItems.length - 1 && updatedItems[index]._id) {
      setEditableItems([
        ...updatedItems,
        { name: "", price: 0, quantity: 1, totalPrice: 0, hsn: "", _id: "" },
      ]);
    }
  };

  const handleValueChange = (
    index: number,
    field: "price" | "quantity",
    value: number
  ) => {
    const updatedItems = [...editableItems];
    updatedItems[index][field] = value;
    updatedItems[index].totalPrice =
      updatedItems[index].price * updatedItems[index].quantity;
    setEditableItems(updatedItems);
  };

  const deleteRow = (index: number) => {
    const updatedItems = editableItems.filter((_, i) => i !== index);
    setEditableItems(updatedItems);
  };

  const getBackgroundColor = () => {
    if (bgColor === "white") return "#ffffff"; 
    if (bgColor === "pink") return "#ffc0cb"; // pink → light pink
    if (bgColor === "yellow") return "#fff9c4"; // yellow → light yellow
    // white → white
    return "#ffffff"; // fallback
  };

  const finalPrice = editableItems.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );
  const discountAmount = (finalPrice * discountPercent) / 100;

  const priceAfterDiscount = finalPrice - discountAmount;
  const gstAmount = withGST ? (priceAfterDiscount * gstRate) / 100 : 0;
  const totalAmount = priceAfterDiscount + gstAmount;


  const convertAmountToWords = (amount: number) => {
    const [rupees, paise] = amount.toFixed(2).split(".");
    const rupeeWords = toWords(Number(rupees)).toUpperCase();
    const paiseWords = toWords(Number(paise)).toUpperCase();
    return `INR ${rupeeWords} AND ${paiseWords} PAISE ONLY`;
  };

  const getInvoiceLink = (invoiceNumber: string) => {
    const domain = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
    return `${domain}/invoice-view/${invoiceNumber}`;
  };

  const generateInvoiceAndUpdateStock = async () => {
    document.activeElement instanceof HTMLElement &&
      document.activeElement.blur();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("❌ Please login again.");
      return;
    }

    const validItems = editableItems.filter(
      (item) =>
        item._id &&
        item.name.trim() !== "" &&
        item.quantity > 0 &&
        item.price > 0
    );

    if (validItems.length === 0) {
      alert("❌ Please select valid products from the suggestion list.");
      return;
    }

    const invalidItems = editableItems.filter(
      (item) => item.name.trim() !== "" && (!item._id || item._id.trim() === "")
    );

    if (invalidItems.length > 0) {
      alert(
        "❌ Some items were not selected from product suggestions. Please fix them."
      );
      return;
    }
    setIsGeneratingPDF(true);
    const itemsToSave = editableItems
      .filter(
        (item) => item._id && item.name.trim() !== "" && item.quantity > 0
      )
      .map((item) => ({
        productId: item._id,
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        totalPrice: item.totalPrice,
        hsn: item.hsn || "",
        discount: item.discount || 0,
      }));

    try {
      const response = await fetch(`${BASE_URL}/orders/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          customerGST,
          customerState,
          items: itemsToSave,
          amountPaid,
          withGST, // ✅ Add this line
          gstRate,
          discountPercent,
          createdAt: invoiceDate, // 🔥 send to backend

          discountAmount, // ✅ And this
          totalAmount,

          oldPendingAdjusted,
          consignee: selectedConsignee,
          carryForward:
            totalAmount + previousPending - (amountPaid + oldPendingAdjusted),
          firm: "himanshi",
        }),
      });

      const data = await response.json();

      if (response.status === 404) {
        alert("❌ API route not found: /api/v1/orders/create-order");
        return;
      }

      if (response.status === 400) {
        alert(`❌ Stock update failed: ${data.message}`);
        return;
      }

      if (data.success) {
        alert("✅ Invoice created & stock updated successfully!");

        // Save invoice in DB and include invoiceNumber + createdAt
        const invoiceRes = await fetch(`${BASE_URL}/invoices`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user: user?._id,
            customerName,
            customerAddress,
            customerGST,
            customerPhone,
            customerState,
            firm: "himanshi",
            invoiceNumber: data.order.invoiceNumber, // ✅ ✅ ✅ ADD THIS LINE
            createdAt: data.order.createdAt,

            items: editableItems.map((item) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              totalPrice: item.totalPrice,
              hsn: item.hsn,
              discount: item.discount || 0,
            })),
            totalAmount: totalAmount,
            withGST,
            consignee: selectedConsignee,
            gstRate,
            totalAmountWithGST: totalAmount + gstAmount,
          }),
        });

        const invoiceData = await invoiceRes.json();

        if (data?.order && invoiceData?.invoice) {
          setOrderData({
            ...data.order,
            invoiceNumber: invoiceData.invoice.invoiceNumber,
            createdAt: invoiceData.invoice.createdAt,
          });

          await fetch(
            `${BASE_URL}/orders/update-invoice-number/${data.order._id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                invoiceNumber: invoiceData.invoice.invoiceNumber,
              }),
            }
          );
        }

        // setIsGeneratingPDF(true);

        if (!user || !user._id) {
          alert("❌ User not found. Please login again.");
          return;
        }

        setTimeout(async () => {
          toPDF({ method: "open", page: { format: "A4" } });

          // Reset form
          setIsGeneratingPDF(false);
          setEditableItems([
            {
              name: "",
              price: 0,
              quantity: 1,
              totalPrice: 0,
              discount: 0,
              hsn: "",
              _id: "",
            },
          ]);

          setCustomerName("");
          setCustomerAddress("");
          setCustomerGST("");
          setCustomerState("");
          setPreviousPending(0);
          setAmountPaid(0);
          setOldPendingAdjusted(0);
        }, 500);
      } else {
        alert("❌ Failed to create invoice. Try again.");
      }
    } catch (error) {
      alert("❌ Something went wrong while generating the invoice.");
    }
  };

  const handleDeleteConsignee = async (id: string) => {
    const token = localStorage.getItem("token");
    const confirm = window.confirm("Are you sure you want to delete?");
    if (!confirm) return;

    const res = await fetch(`${BASE_URL}/consignees/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (data.success) {
      setConsignees((prev) => prev.filter((c) => c._id !== id));
      setSelectedConsignee(null);
      alert("✅ Consignee deleted");
    } else {
      alert("❌ Failed to delete");
    }
  };

  const handleSaveConsignee = async () => {
    const token = localStorage.getItem("token");
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${BASE_URL}/consignees/${editingId}`
      : `${BASE_URL}/consignees`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newConsignee),
    });

    const data = await res.json();
    if (data.success) {
      alert(`✅ Consignee ${editingId ? "updated" : "added"} successfully`);
      if (!editingId) {
        setConsignees((prev) => [...prev, data.consignee]);
      } else {
        setConsignees((prev) =>
          prev.map((c) => (c._id === editingId ? data.consignee : c))
        );
      }
      setNewConsignee({ name: "", address: "", gstin: "", pan: "", state: "" });
      setAddingNew(false);
      setEditingId(null);
    } else {
      alert("❌ Failed to save consignee");
    }
  };

  return (
    <div className="p-4">
      {isGeneratingPDF && (
      <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-white/60 z-[9999]">
        <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
      </div>
    )}
    

      <div>
        {/* CONTROLS */}
        <div className="print:hidden flex flex-wrap gap-4 mb-4">
          <select
            className="border px-2 py-1 text-sm"
            value={gstRate}
            onChange={(e) => setGstRate(Number(e.target.value))}
          >
            <option value="5">5%</option>
            <option value="9">9%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>

          <select
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="border px-2 py-1 text-sm"
          >
            <option value="white">White</option>
            <option value="yellow">Yellow</option>
            <option value="pink">Pink</option>
          </select>
        </div>

        {/* INVOICE BODY */}
        <div
          id="printable-invoice"
          ref={targetRef}
          className="p-6  bg-white print:bg-white print:p-4 print:shadow-none print:w-[794px] print:m-auto"
          style={{ backgroundColor: getBackgroundColor() }}
        >
          <h2 className="text-md font-bold text-center   pb-2">TAX INVOICE</h2>

          {/* HEADER */}
          <div className="border border-black  flex">
            <div className="w-[70%] border-r border-black p-4 text-sm min-h-[340px] flex flex-col justify-between">
              {/* HIMANSHI TEXTILES */}
              <div>
                <h1 className="text-2xl font-bold">HIMANSHI TEXTILES</h1>
                <p className=" text-base">
                  GROUND FLOOR, 2449, CHOUDHRY BHAWAN, TELIPARA, JAIPUR
                </p>
                <p className="text-base ">GSTIN/UIN: 08GNYPS6300G1ZD</p>
                <p className="text-base ">Mobile:9971745882</p>
                <p className=" text-base ">State Name: Rajasthan, Code: 08</p>
              </div>

              {/* CONSIGNEE */}
              <div className="mt-4  border-black border-t pt-2">
                <div className="flex justify-between items-center print:hidden">
                  <h3 className=" text-base font-medium">
                    CONSIGNEE (SHIP TO)
                  </h3>
                  {!isGeneratingPDF && (
                    <div className="flex items-center gap-2">
                      <select
                        className="border px-2 py-1 text-sm"
                        onChange={(e) => {
                          const selected = consignees.find(
                            (c) => c._id === e.target.value
                          );
                          setSelectedConsignee(selected);
                        }}
                      >
                        <option value="">Select Consignee</option>
                        {consignees.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className="bg-green-500 text-white px-2 py-1 text-sm rounded hover:bg-green-600"
                        onClick={() => {
                          setAddingNew(true);
                          setEditingId(null);
                          setNewConsignee({
                            name: "",
                            address: "",
                            gstin: "",
                            pan: "",
                            state: "",
                          });
                        }}
                      >
                        ➕
                      </button>
                    </div>
                  )}
                </div>

                {selectedConsignee && !addingNew && (
                  <div className="text-sm mt-0 space-y-[2px]">
                    <p>
                      <strong className="text-lg">
                        {selectedConsignee.name}
                      </strong>
                    </p>
                    <p className="text-base">{selectedConsignee.address}</p>
                    <p className="text-base">
                      GSTIN/UIN: {selectedConsignee.gstin}
                    </p>
                    <p className="text-base">
                      PAN/IT No: {selectedConsignee.pan}
                    </p>
                    <p className="text-base">
                      State Name: {selectedConsignee.state}
                    </p>
                    {!isGeneratingPDF && (
                      <div className="flex gap-2 mt-0 print:hidden">
                        {/* <button className="text-blue-600 text-sm"
                onClick={() => {
                  setEditingId(selectedConsignee._id);
                  setNewConsignee({ ...selectedConsignee });
                  setAddingNew(true);
                }}
              >✏️</button> */}
                        <button
                          className="text-red-600 text-sm"
                          onClick={() =>
                            handleDeleteConsignee(selectedConsignee._id)
                          }
                        >
                          ❌
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {addingNew && (
                  <div className="mt-3 space-y-2 print:hidden">
                    {["name", "address", "gstin", "pan", "state"].map(
                      (field) => (
                        <input
                          key={field}
                          className="w-full border px-3 py-1 text-sm rounded"
                          placeholder={`Enter ${field}`}
                          value={newConsignee[field]}
                          onChange={(e) =>
                            setNewConsignee({
                              ...newConsignee,
                              [field]: e.target.value,
                            })
                          }
                        />
                      )
                    )}
                    <div className="flex gap-2">
                      <button
                        className="bg-blue-500 text-white px-4 py-1 rounded"
                        onClick={handleSaveConsignee}
                      >
                        ✅ Save
                      </button>
                      <button
                        className="bg-gray-400 text-white px-4 py-1 rounded"
                        onClick={() => {
                          setAddingNew(false);
                          setEditingId(null);
                          setNewConsignee({
                            name: "",
                            address: "",
                            gstin: "",
                            pan: "",
                            state: "",
                          });
                        }}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* BUYER (BILL TO) */}
              <div className="mt-4  border-black border-t pt-2">
                <h3 className="font-medium text-base pb-1 mb-2">
                  Buyer (Bill To)
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <p>
                    <strong>Name:</strong>{" "}
                    {isGeneratingPDF ? (
                      <span>{customerName || "N/A"}</span>
                    ) : (
                      <input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
                      />
                    )}
                  </p>
                  <p className="flex items-center gap-2">
                    <strong>Phone:</strong>{" "}
                    {isGeneratingPDF ? (
                      <span>{customerPhone || "N/A"}</span>
                    ) : (
                      <>
                        <input
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
                        />
                        <button
                          onClick={async () => {
                            if (!customerPhone || customerPhone.length < 4) {
                              alert("Please enter valid phone number.");
                              return;
                            }
                            try {
                              const token = localStorage.getItem("token");
                              const res = await fetch(
                                `${BASE_URL}/orders/pending?phone=${customerPhone}`,
                                {
                                  headers: { Authorization: `Bearer ${token}` },
                                }
                              );
                              const data = await res.json();
                              setPreviousPending(data?.pendingAmount || 0);
                            } catch (err) {
                              setPreviousPending(0);
                            }
                          }}
                          className="bg-blue-500 text-white px-2 py-1 text-sm rounded hover:bg-blue-600 print:hidden"
                        >
                          🔍
                        </button>
                      </>
                    )}
                  </p>
                  <p>
                    <strong>Address:</strong>{" "}
                    {isGeneratingPDF ? (
                      <span>{customerAddress || "N/A"}</span>
                    ) : (
                      <input
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
                      />
                    )}
                  </p>
                  <p>
                    <strong>GSTIN:</strong>{" "}
                    {isGeneratingPDF ? (
                      <span>{customerGST || "N/A"}</span>
                    ) : (
                      <input
                        value={customerGST}
                        onChange={(e) => setCustomerGST(e.target.value)}
                        className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
                      />
                    )}
                  </p>
                  <p>
                    <strong>State:</strong>{" "}
                    {isGeneratingPDF ? (
                      <span>{customerState || "N/A"}</span>
                    ) : (
                      <input
                        value={customerState}
                        onChange={(e) => setCustomerState(e.target.value)}
                        className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
                      />
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ RIGHT SIDE: QR + Invoice Table */}
            <div className="w-[34%] p-4 text-xs font-medium min-h-[480px] flex flex-col items-end text-right">
              <div className="w-full flex justify-end mb-3">
              <QRCode
      value={`https://djtextile.in/invoices/${orderData?.invoiceNumber.replace(/\//g, '')}.pdf`}
      size={140}
    />

              </div>
              <table className="w-[105%]  border border-black text-[13px] ">
                <tbody>
                  <tr>
                    <td className="border px-2 py-3 font-semibold w-[40%]  text-left">
                      Invoice No
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {orderData?.invoiceNumber || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-3 font-semibold text-left">
                      Dated
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {!isGeneratingPDF ? (
                        <input
                          type="date"
                          className="border px-2 py-1 text-sm"
                          value={moment(invoiceDate).format("YYYY-MM-DD")}
                          onChange={(e) =>
                            setInvoiceDate(new Date(e.target.value))
                          }
                        />
                      ) : (
                        moment(invoiceDate).format("DD MMM, YYYY")
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="border px-2 py-3 font-semibold  text-left">
                      Delivery Note
                    </td>
                    <td className="border px-2 py-1 text-right ">_</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-3 font-semibold  text-left">
                      Reference No. & Date
                    </td>
                    <td className="border px-2 py-1 text-right ">
                      Other References
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-3 font-semibold text-left">
                      Dispatch Doc No.
                    </td>
                    <td className="border px-2 py-1 text-right ">
                      Delivery Note Date
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-3 font-semibold  text-left">
                      Dispatched through
                    </td>
                    <td className="border px-2 py-1 text-right">Destination</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>



          
          <div className="border border-black  p-4">
            <table className="w-full border mt-4 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border py-1">Sr.</th>
                  <th className="border py-1">Description of Goods </th>
                  <th className="border py-1">HSN/SAC </th>
                  <th className="border py-1">Quantity </th>
                  <th className="border py-1">Rate</th>
                  <th className="border py-1">Discount</th>

                  <th className="border py-1">Amount</th>
                  {!isGeneratingPDF && (
                    <th className="border py-1 action-header">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {editableItems
                  .filter((item) => item.name.trim() !== "" || !isGeneratingPDF) // ❌ skip blank rows in print
                  .map((item, index) => (
                    <tr key={index}>
                      <td className="border text-center py-1">{index + 1}</td>
                      <td className="border text-center py-1">
                        {isGeneratingPDF ? (
                          <div className="text-md">{item.name}</div>
                        ) : (
                          <div className="relative">
                            <input
                              className="w-full text-xs px-2 py-1 border rounded-sm bg-white"
                              value={item.name}
                              onChange={(e) =>
                                handleProductNameChange(index, e.target.value)
                              }
                            />
                            {/* Dropdown */}
                            {productSuggestions.length > 0 &&
                              index === editableItems.length - 1 && (
                                <ul className="absolute top-full left-0 mt-1 bg-white border w-full shadow z-50 max-h-40 overflow-y-auto text-left">
                                  {productSuggestions.map((prod, i) => (
                                    <li
                                      key={i}
                                      className="px-2 py-1 text-xs hover:bg-gray-100 cursor-pointer"
                                      onClick={() =>
                                        handleSuggestionSelect(index, prod)
                                      }
                                    >
                                      {prod.productName} - ₹{prod.price}
                                    </li>
                                  ))}
                                </ul>
                              )}
                          </div>
                        )}
                      </td>

                      <td className="border text-center py-1">5155</td>

                      <td className="border text-center py-1">
                        {isGeneratingPDF ? (
                          <div className="text-md">{item.quantity}</div>
                        ) : (
                          <input
                            type="number"
                            className="w-16 text-xs px-2 py-1 border rounded-sm"
                            value={item.quantity}
                            onChange={(e) =>
                              handleValueChange(
                                index,
                                "quantity",
                                Number(e.target.value)
                              )
                            }
                          />
                        )}
                      </td>

                      <td className="border text-center py-1">
                        {isGeneratingPDF ? (
                          <div className="text-md">₹{item.price}</div>
                        ) : (
                          <input
                            type="number"
                            className="w-20 text-xs px-2 py-1 border rounded-sm"
                            value={item.price}
                            onChange={(e) =>
                              handleValueChange(
                                index,
                                "price",
                                Number(e.target.value)
                              )
                            }
                          />
                        )}
                      </td>
                      <td className="border text-center py-1">
                        {isGeneratingPDF ? (
                          <div className="text-xs">
                            {item.discount ? `${item.discount}%` : "—"}
                          </div>
                        ) : (
                          <select
                            className="text-xs border px-1 py-0"
                            value={item.discount || 0}
                            onChange={(e) => {
                              const updatedItems = [...editableItems];
                              const discount = Number(e.target.value);
                              updatedItems[index].discount = discount;
                              const discountedPrice =
                                updatedItems[index].price -
                                (updatedItems[index].price * discount) / 100;
                              updatedItems[index].totalPrice =
                                discountedPrice * updatedItems[index].quantity;
                              setEditableItems(updatedItems);
                            }}
                          >
                            <option value={0}>0%</option>
                            <option value={1}>1%</option>
                            <option value={2}>2%</option>
                            <option value={3}>3%</option>
                            <option value={4}>4%</option>
                            <option value={5}>5%</option>
                          </select>
                        )}
                      </td>

                      <td className="border text-center py-1 font-semibold">
                        ₹{item.totalPrice.toFixed(2)}
                      </td>
                      {!isGeneratingPDF && (
                        <td className="border text-center py-1 action-cell">
                          <button
                            onClick={() => deleteRow(index)}
                            className="text-red-500 text-xs"
                          >
                            ❌
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* ✅ GST + Discount + Final Total WITH Amount in Words SIDE-BY-SIDE */}
            <div className="w-full flex justify-between mt-2">
              {/* LEFT SIDE – Amount in Words */}
              <div className="w-[62%] mt-3 border border-black p-2 italic text-sm font-semibold">
                Amount Chargeable (In Words):{" "}
                <strong>
                  {toWords(Math.round(totalAmount)).toUpperCase()} ONLY
                </strong>
              </div>

              {/* RIGHT SIDE – Gross / Discount / CGST / SGST / Total */}
              <div className="  mt-1 text-sm w-[38%]">
                <div className="p-2 text-xs ">
                  <div className="grid grid-cols-2 gap-[1px]">
                    {/* Gross */}
                    <div className="border border-gray-400 font-bold px-1 py-[3px]">
                      Gross
                    </div>
                    <div className="border border-gray-400 font-bold px-2 py-1 text-right">
                      ₹{finalPrice.toFixed(2)}
                    </div>

                    {/* Discount (only if applied) */}
                    {discountPercent > 0 && (
                      <>
                        <div className="border border-gray-400 px-2 py-1">
                          Discount @{discountPercent}%
                        </div>
                        <div className="border border-gray-400 px-2 py-1 text-right">
                          – ₹{discountAmount.toFixed(2)}
                        </div>
                      </>
                    )}

                    {/* GST */}
                    {withGST && (
                      <>
                        <div className="border border-gray-400 px-2 py-1">
                          CGST @{gstRate / 2}%
                        </div>
                        <div className="border border-gray-400 px-2 py-1 text-right">
                          ₹{(gstAmount / 2).toFixed(2)}
                        </div>

                        <div className="border border-gray-400 px-2 py-1">
                          SGST @{gstRate / 2}%
                        </div>
                        <div className="border border-gray-400 px-2 py-1 text-right">
                          ₹{(gstAmount / 2).toFixed(2)}
                        </div>
                      </>
                    )}

                    {/* Final Total */}
                    <div className="border border-gray-400 px-2 py-1 font-bold">
                      Total
                    </div>
                    <div className="border border-gray-400 px-2 py-1 text-right font-bold">
                      ₹{totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT / DUES SECTION - Clean & Professional */}
            <div className="w-full flex justify-between mt-4">
              <div className="mt-2  w-[55%] text-sm  border border-black font-semibold italic">
                GST Amount (in words):{" "}
                <span className="font-bold">
                  {convertAmountToWords(gstAmount)}
                </span>
              </div>

              <div className="text-xs w-fit border border-black">
                <div className="grid grid-cols-4 grid-rows-2 font-semibold text-xs text-center">
                  {/* Row 1: Headings */}
                  <div className="border border-gray-400 px-2 py-[3px] bg-gray-100">
                    Previous Pending
                  </div>
                  <div className="border border-gray-400 px-2 py-[3px] bg-gray-100">
                    Adjust from Previous
                  </div>
                  <div className="border border-gray-400 px-2 py-[3px] bg-gray-100">
                    Amount Paid (₹)
                  </div>
                  <div className="border border-gray-400 px-2 py-[3px] bg-gray-100 text-red-600">
                    Carry Forward
                  </div>

                  {/* Row 2: Values */}
                  <div className="border border-gray-400 px-2 py-[3px]">
                    <span
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) =>
                        setPreviousPending(Number(e.currentTarget.innerText))
                      }
                      className="outline-none focus:outline-none w-full inline-block print:border-none text-right"
                    >
                      {previousPending}
                    </span>
                  </div>

                  <div className="border border-gray-400 px-2 py-[3px]">
                    <span
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) =>
                        setOldPendingAdjusted(Number(e.currentTarget.innerText))
                      }
                      className="outline-none focus:outline-none w-full inline-block print:border-none text-right"
                    >
                      {oldPendingAdjusted}
                    </span>
                  </div>

                  <div className="border border-gray-400 px-2 py-[3px]">
                    <span
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) =>
                        setAmountPaid(Number(e.currentTarget.innerText))
                      }
                      className="outline-none focus:outline-none w-full inline-block print:border-none text-right"
                    >
                      {amountPaid}
                    </span>
                  </div>

                  <div className="border border-gray-400 px-2 py-[3px] text-red-600 font-semibold text-right">
                    ₹
                    {(
                      totalAmount +
                      previousPending -
                      (amountPaid + oldPendingAdjusted)
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 border border-black p-4 text-sm">
              <div className="flex justify-between">
                {/* LEFT SIDE: Terms */}
                <div className="w-[30%]">
                  <p className="font-bold">Terms & Conditions:</p>
                  <p>1. Goods once sold will not be taken back.</p>
                  <p>2. All disputes are subject to Rohtak Jurisdiction.</p>
                  <p>3. E & O.E.</p>
                </div>

                {/* CENTER: Bank Details */}
                <div className="text-center w-[40%] leading-[1.5]">
                  <p className="font-semibold">Bank Details</p>
                  <p>
                    <strong>Bank Name:</strong> INDUSLND BANK LTD
                  </p>
                  <p>
                    <strong>Account No:</strong> 201002825718
                  </p>
                  <p>
                    <strong>IFSC:</strong> INDB0000710
                  </p>
                </div>

                {/* RIGHT SIDE: Signature */}
                <div className="text-right w-[30%] font-semibold">
                  <p>for: HIMANSHI TEXTILES</p>
                  <p className="mt-6">Auth. Signatory</p>
                </div>
              </div>

              {/* Center Bottom Text */}
              <p className="text-center mt-4 italic text-gray-600">
                This is a Computer Generated Invoice. Signature Not Required.
              </p>
            </div>
          </div>

          {/* Print Button */}
          <div className="mt-4 print:hidden">
            {!isGeneratingPDF && (
             <button
             onClick={generateInvoiceAndUpdateStock}
             className="px-6 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
             disabled={isGeneratingPDF || editableItems.length === 0 || editableItems
               .filter((item) => item.name.trim() !== "")
               .some((item) => !item._id || item._id.trim() === "")}
           >
             {isGeneratingPDF ? "Generating..." : "Generate Invoice"}
           </button>
           
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceBuilder2;
