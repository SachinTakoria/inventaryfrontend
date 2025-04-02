import { useEffect, useState } from "react";
import axios from "axios";
import BasicChart from "./components/Basic";
import PieChartDemo from "./components/Pie";
import { CalendarChangeEvent } from 'primereact/calendar';


// 🆕 PrimeReact Date Picker
import { Calendar } from 'primereact/calendar';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';

const HomePage = () => {
  const [stats, setStats] = useState({
    todaySale: 0,
    yesterdaySale: 0,
    totalUsers: 0,
    totalOrders: 0,
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateSale, setDateSale] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/orders/sales-stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
  }, []);

  const fetchSaleByDate = async (date: Date | null) => {
    if (!date) return;
    const formatted = date.toISOString().split("T")[0]; // YYYY-MM-DD
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/orders/sale-summary?date=${formatted}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setDateSale(data.totalSale);
    } catch (error) {
      console.error("Error fetching date-wise sale:", error);
    }
  };

  return (
    <div className="p-4 w-full space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Today's Sale" value={`₹${stats.todaySale}`} />
        <Card title="Yesterday's Sale" value={`₹${stats.yesterdaySale}`} />
        <Card title="Total Users" value={stats.totalUsers} />
        <Card title="Total Orders" value={stats.totalOrders} />
      </div>

      {/* 🆕 Date-wise Sale Filter */}
      <div className="bg-white shadow-md rounded-xl p-4 w-full sm:w-[320px]">
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


      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BasicChart />
        <PieChartDemo />
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
