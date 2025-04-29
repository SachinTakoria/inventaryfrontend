import { useEffect, useState } from "react";
import axios from "axios";
import BasicChart from "./components/Basic";
import PieChartDemo from "./components/Pie";
import { CalendarChangeEvent } from "primereact/calendar";
import { Calendar } from "primereact/calendar";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";

const HomePage = () => {
  const [stats, setStats] = useState({
    todaySale: 0,
    yesterdaySale: 0,
    todayBills: 0,
    totalUsers: 0,
    totalOrders: 0,
  });

  const [purchaseSummary, setPurchaseSummary] = useState<
    { date: string; total: number }[]
  >([]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateSale, setDateSale] = useState<number | null>(null);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [rangePurchaseTotal, setRangePurchaseTotal] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/orders/sales-stats`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats", err);
      }
    };

    const fetchPurchaseSummary = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/purchase-invoice/purchase-summary?days=3`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setPurchaseSummary(data);
      } catch (err) {
        console.error("Error fetching purchase summary", err);
      }
    };

    fetchStats();
    fetchPurchaseSummary();
  }, []);

  const fetchSaleByDate = async (date: Date | null) => {
    if (!date) return;
    const formatted = date.toISOString().split("T")[0];
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/orders/sale-summary?date=${formatted}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setDateSale(data.totalSale);
    } catch (error) {
      console.error("Error fetching sale summary by date", error);
    }
  };

  const fetchPurchaseByDateRange = async () => {
    if (!startDate || !endDate) return;

    const formattedStart = startDate.toISOString().split("T")[0];
    const formattedEnd = endDate.toISOString().split("T")[0];

    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/purchase-invoice/summary-by-dates?startDate=${formattedStart}&endDate=${formattedEnd}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setRangePurchaseTotal(data.totalPurchase || 0);
    } catch (err) {
      console.error("Error fetching date range purchase:", err);
    }
  };

  return (
    <div className="p-4 w-full space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Today's Sale" value={`₹${stats.todaySale}`} />
        <Card title="Yesterday's Sale" value={`₹${stats.yesterdaySale}`} />
        <Card title="Today's Bills" value={stats.todayBills} />
        <Card title="Total Bills" value={stats.totalOrders} />

        {/* Dynamically show purchase summary for each day */}
        {purchaseSummary.map((entry, index) => (
          <Card
            key={index}
            title={
              index === purchaseSummary.length - 1
                ? "Today's Purchase"
                : index === purchaseSummary.length - 2
                ? "Yesterday's Purchase"
                : `${entry.date} Purchase`
            }
            value={`₹${entry.total}`}
          />
        ))}
      </div>
{/* Date-wise Sale Filter and Purchase Summary Side-by-Side */}
<div className="flex flex-col md:flex-row gap-4">
  
  {/* View Sale by Date */}
  <div className="bg-white shadow-md rounded-xl p-4 w-full md:w-1/2">
    <p className="text-gray-600 font-medium text-sm mb-2 flex items-center gap-2">
      <span className="text-lg">🔍</span> View Sale by Date
    </p>
    <div className="flex items-center gap-3">
      <Calendar
        value={selectedDate}
        onChange={(e: CalendarChangeEvent) => {
          setSelectedDate(e.value as Date);
          fetchSaleByDate(e.value as Date);
        }}
        dateFormat="yy-mm-dd"
        showIcon
        className="w-full"
      />
      {dateSale !== null && (
        <div className="text-base font-semibold text-indigo-600 min-w-[60px] text-right">
          ₹{dateSale}
        </div>
      )}
    </div>
  </div>

  {/* Purchase Summary by Date Range */}
  <div className="bg-white shadow-md rounded-xl p-4 w-full md:w-1/2">
    <p className="text-gray-600 font-medium text-sm mb-2 flex items-center gap-2">
      📅 Purchase Summary by Date Range
    </p>
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <Calendar
        value={startDate}
        onChange={(e: CalendarChangeEvent) => setStartDate(e.value as Date)}
        dateFormat="yy-mm-dd"
        placeholder="From Date"
        showIcon
        className="w-full"
      />
      <Calendar
        value={endDate}
        onChange={(e: CalendarChangeEvent) => setEndDate(e.value as Date)}
        dateFormat="yy-mm-dd"
        placeholder="To Date"
        showIcon
        className="w-full"
      />
      <button
        onClick={fetchPurchaseByDateRange}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
      >
        Get Summary
      </button>
    </div>
    {rangePurchaseTotal !== null && (
      <div className="text-xl font-bold text-indigo-600 mt-4">
        ₹{rangePurchaseTotal.toLocaleString()} Total Purchase
      </div>
    )}
  </div>

</div>


      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BasicChart stats={stats} purchaseSummary={purchaseSummary} />
        <PieChartDemo stats={stats} purchaseSummary={purchaseSummary} />
      </div>
    </div>
  );
};

const Card = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-white shadow-md rounded-xl p-6">
    <p className="text-gray-500 font-semibold">{title}</p>
    <h2 className="text-2xl font-bold text-indigo-600 mt-2">{value}</h2>
  </div>
);

export default HomePage;

