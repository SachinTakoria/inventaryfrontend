import { Dialog } from "primereact/dialog";
import { useState, useEffect } from "react";
import { ErrorMessage, Field, Formik, FieldArray } from "formik";
import { toast } from "sonner";
import * as yup from "yup";
import { useGetForSearchUserQuery } from "../../../provider/queries/Users.query";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import Loader from "../../../components/Loader";
import { useNavigate } from "react-router-dom";
import {
  useCreateOrderMutation,
  useUpdateOrderMutation,
} from "../../../provider/queries/Orders.query";
import axios from "axios";
import { useLocation } from "react-router-dom";

type Product = {
  productName: string;
  price: number;
  stock: number;
};

const AddOrderModel = ({ visible, setVisible }: any) => {
  const [CreateOrder] = useCreateOrderMutation();
  const { isLoading, isFetching, data } = useGetForSearchUserQuery({});
  const [products, setProducts] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]); // ✅ Suggestions for Item Name
  const location = useLocation();
  const navigate=useNavigate()


  const [UpdateOrder] = useUpdateOrderMutation(); // ✅ added

  if (isLoading || isFetching) {
    return <Loader />;
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/v1/products/products"
        );
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  // ✅ Function to handle item name change & auto-suggestions
  const handleItemNameChange = (e: any, index: number, setFieldValue: any) => {
    const value = e.target.value;
    setFieldValue(`items[${index}].name`, value);

    if (value.length > 0) {
      const filteredSuggestions = products.filter((product: any) =>
        product.productName.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  // ✅ Function to handle when an item is selected from suggestions
  const handleSuggestionClick = (
    name: string,
    price: number,
    stock: number = 0,
    index: number,
    setFieldValue: any
  ) => {
    setFieldValue(`items[${index}].name`, name);
    setFieldValue(`items[${index}].price`, price);
    setFieldValue(`items[${index}].stock`, stock); // ✅ Stock value added
    setFieldValue(`items[${index}].quantity`, 1); // Default quantity 1
    setFieldValue(`items[${index}].totalPrice`, price * 1); // Auto-Calculate Total Price
    setSuggestions([]);
  };

  // ✅ Function to auto-calculate total price based on quantity
  const handleQuantityChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    setFieldValue: any,
    values: { items: { name: string; price: number; totalPrice: number }[] }
  ) => {
    const quantity = Number(e.target.value);
    if (quantity < 1) return; // ✅ Quantity 1 se kam nahi ho sakti

    // ✅ Check if products array is properly loaded
    if (!products || products.length === 0) {
      toast.error("Products not loaded yet! Please try again.");
      return;
    }

    // ✅ Find the selected product (Proper Type Safety)
    const selectedProduct: Product | undefined = products.find(
      (p) =>
        p.productName.toLowerCase() === values.items[index]?.name?.toLowerCase()
    );

    if (!selectedProduct) {
      toast.error("Product not found in inventory!");
      console.log("Debug: Products array =>", products);
      return;
    }

    if (selectedProduct.stock === undefined || selectedProduct.stock < 0) {
      toast.error("Stock data is incorrect!");
      console.log("Debug: Selected Product =>", selectedProduct);
      return;
    }

    if (quantity > selectedProduct.stock) {
      toast.error("Not enough stock available!");
      return;
    }

    // ✅ Update form field values
    setFieldValue(`items[${index}].quantity`, quantity);
    setFieldValue(
      `items[${index}].totalPrice`,
      quantity * values.items[index].price
    );
  };

  // ✅ Form validation schema
  const validationSchema = yup.object({
    user: yup.mixed().required("User is required"),
    consumer: yup.mixed().required("Consumer is required"),
    items: yup.array().of(
      yup.object().shape({
        name: yup.string().required("Item Name required"),
        price: yup
          .number()
          .typeError("Price must be a number")
          .required("Item Price required"),
        quantity: yup
          .number()
          .typeError("Quantity must be a number")
          .required("Quantity required"),
      })
    ),
  });

  // ✅ Step 1: Prepare initial values outside component render
const getInitialValues = (state: any) => {
  if (state) {
    return {
      user: state.user || null,
      consumer: state.consumer || null,
      items: Array.isArray(state.items)
        ? state.items.map((item: any) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            totalPrice: item.totalPrice || item.price * item.quantity,
            stock: item.stock || 0,
          }))
        : [],
    };
  } else {
    return {
      user: null,
      consumer: null,
      items: [
        {
          name: "",
          price: 0,
          quantity: 1,
          totalPrice: 0,
          stock: 0,
        },
      ],
    };
  }
};

const initialValues = getInitialValues(location.state);

  // ✅ Form submission handler
  const onSubmitHandler = async (e: any, { resetForm }: any) => {
    try {
      const payload = {
        user: e.user._id,
        consumer: e.consumer._id,
        items: e.items,
      };

      let response;

      // ✅ Check if we're in EDIT mode
      if (location.state && location.state._id) {
        // UPDATE order
        response = await UpdateOrder({ id: location.state._id, data: payload });
        toast.success("Order Updated Successfully");
      } else {
        // CREATE order (same as your existing logic)
        response = await CreateOrder(payload);
        toast.success("Order Created Successfully");
      }

      const { data, error }: any = response;

      if (error) {
        toast.error(error.data.message);
        return;
      }

      // ✅ Stock update logic — untouched (copied as-is)
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          if (!e || !e.items || e.items.length === 0) return product;

          const orderedItem = e.items.find(
            (item: { name: string; quantity: number }) =>
              item.name.toLowerCase() === product.productName.toLowerCase()
          );

          if (orderedItem && typeof orderedItem.quantity === "number") {
            return {
              ...product,
              stock: Math.max(0, product.stock - orderedItem.quantity),
            };
          }

          return product;
        })
      );

      console.log(
        location.state
          ? "Order Updated Successfully: "
          : "Order Created Successfully: ",
        data
      );

      resetForm();
      setVisible(false);
      
      // ✅ After small delay, navigate to orders list page
      setTimeout(() => {
        navigate("/orders"); // ✅ safe redirect
      }, 300); // wait for animation/toast to finish
      
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    setFieldValue: any,
    values: { items: { quantity: number }[] }
  ) => {
    const price = Number(e.target.value);
    if (price < 0) return;
    setFieldValue(`items[${index}].price`, price);
    const quantity = values.items[index]?.quantity || 1;
    setFieldValue(`items[${index}].totalPrice`, price * quantity);
  };

  return (
    <>
      <Dialog
        draggable={false}
        header="Add Order"
        position="top"
        visible={visible}
        className="w-full md:w-[70%] lg:w-[60%]"
        onHide={() => setVisible(false)}
        closable={true} // ✅ just to be extra safe
      >
        <Formik
          onSubmit={onSubmitHandler}
          initialValues={initialValues}
          enableReinitialize
          validationSchema={validationSchema}
        >
          {({ values, setFieldValue, handleSubmit }) => (
            <>
              <form onSubmit={handleSubmit} className="w-full">
                {/* ✅ User Dropdown */}
                <div className="mb-3">
                  <label htmlFor="user">
                    User <span className="text-red-500 text-sm">*</span>
                  </label>
                  <Dropdown
                    value={values.user}
                    onChange={(e) => setFieldValue("user", e.value)}
                    options={data?.users || []}
                    filterBy="name"
                    filterPlaceholder="Search User By Name"
                    optionLabel="name"
                    placeholder="Select a User"
                    emptyFilterMessage="No User Found"
                    emptyMessage="You Have No User"
                    filter
                    className="w-full my-2 border outline-none ring-0"
                  />
                  <ErrorMessage
                    name="user"
                    className="text-red-500 capitalize"
                    component={"p"}
                  />
                </div>

                {/* ✅ Consumer Dropdown */}
                <div className="mb-3">
                  <label htmlFor="consumer">
                    Consumer <span className="text-red-500 text-sm">*</span>
                  </label>
                  <Dropdown
                    value={values.consumer}
                    onChange={(e) => setFieldValue("consumer", e.value)}
                    options={data?.users || []}
                    filterBy="name"
                    filterPlaceholder="Search Consumer By Name"
                    optionLabel="name"
                    placeholder="Select a Consumer"
                    emptyFilterMessage="No Consumer Found"
                    emptyMessage="You Have No Consumer"
                    filter
                    className="w-full my-2 border outline-none ring-0"
                  />
                  <ErrorMessage
                    name="consumer"
                    className="text-red-500 capitalize"
                    component={"p"}
                  />
                </div>

                {/* ✅ Items Section */}
                <div className="mb-3">
                  <label htmlFor="items">
                    Items <span className="text-red-500 text-sm">*</span>
                  </label>
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <>
                        {/* ✅ "Add +" Button for Adding Multiple Items */}
                        <div className="mb-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              push({
                                name: "",
                                price: 0,
                                quantity: 1,
                                totalPrice: 0,
                              })
                            }
                            className="bg-purple-500 px-4 text-white py-2 rounded-md"
                          >
                            Add +
                          </button>
                        </div>

                        {/* ✅ Mapping Through Items */}
                        {values.items.map((_, index:number) => (
                          <div key={index} className="flex gap-4 items-center">
                            {/* ✅ Item Name Field with Auto-Suggestions */}
                            <div className="w-1/3 relative">
                              <Field
                                name={`items[${index}].name`}
                                className="w-full my-2 border outline-none py-3 px-4"
                                placeholder="Item Name"
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) =>
                                  handleItemNameChange(e, index, setFieldValue)
                                }
                              />
                              {suggestions.length > 0 && (
                                <ul className="absolute bg-white shadow-md border w-full max-h-40 overflow-y-auto">
                                  {suggestions.map(
                                    (
                                      suggestion: {
                                        productName: string;
                                        price: number;
                                        stock?: number;
                                      },
                                      i
                                    ) => (
                                      <li
                                        key={i}
                                        className="p-2 cursor-pointer hover:bg-gray-200"
                                        onClick={() =>
                                          handleSuggestionClick(
                                            suggestion.productName,

                                            suggestion.price,
                                            suggestion.stock ?? 0,
                                            index,
                                            setFieldValue
                                          )
                                        }
                                      >
                                        {suggestion.productName} - ₹
                                        {suggestion.price}
                                      </li>
                                    )
                                  )}
                                </ul>
                              )}
                              <ErrorMessage
                                name={`items[${index}].name`}
                                className="text-red-500 capitalize"
                                component="p"
                              />
                            </div>

                            {/* ✅ Quantity Field */}
                            <div className="w-1/6">
                              <Field
                                type="number"
                                name={`items[${index}].quantity`}
                                className="w-full my-2 border outline-none py-3 px-4"
                                placeholder="Qty"
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) =>
                                  handleQuantityChange(
                                    e,
                                    index,
                                    setFieldValue,
                                    values
                                  )
                                }
                              />
                            </div>

                            {/* ✅ Item Price Field (Non-Editable) */}
                            <div className="w-1/6">
                              <Field
                                type="number"
                                name={`items[${index}].price`}
                                className="w-full my-2 border outline-none py-3 px-4 bg-gray-100"
                                placeholder="Price"
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) =>
                                  handlePriceChange(
                                    e,
                                    index,
                                    setFieldValue,
                                    values
                                  )
                                }
                              />
                            </div>

                            {/* ✅ Total Price (Auto Calculated) */}
                            <div className="w-1/6">
                              <Field
                                type="number"
                                name={`items[${index}].totalPrice`}
                                className="w-full my-2 border outline-none py-3 px-4 bg-gray-200"
                                placeholder="Total"
                                readOnly
                              />
                            </div>

                            {/* ✅ Delete Button */}
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-red-500 text-lg"
                            >
                              ❌
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </FieldArray>
                </div>

                {/* ✅ Grand Total Calculation */}
                <div className="flex justify-end text-lg font-bold mt-4">
                  <span>
                    Grand Total: ₹
                    {values.items.reduce(
                      (total, item) => total + (Number(item.totalPrice) || 0),
                      0
                    )}
                  </span>
                </div>

                {/* ✅ Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="text-white px-5 rounded-sm bg-indigo-500 py-3 text-center"
                  >
                    Add Consumer
                  </Button>
                </div>
              </form>
            </>
          )}
        </Formik>
      </Dialog>
    </>
  );
};

export default AddOrderModel;
