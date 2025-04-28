import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { useDispatch, useSelector } from 'react-redux';
import { SidebarSlicePath, toggleSidebar } from '../provider/slice/Sidebar.slice';
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { FaFileInvoice } from "react-icons/fa";
import { RiBillLine } from "react-icons/ri";
import { BiSolidPurchaseTag } from "react-icons/bi";
import { IoIosArrowDropright, IoIosArrowDropleft } from "react-icons/io";
import { AiOutlinePlus } from "react-icons/ai";
import { Link } from 'react-router-dom';
import { MdProductionQuantityLimits } from "react-icons/md";
import { useEffect, useState } from 'react';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const selector = useSelector(SidebarSlicePath);
  const dispatch = useDispatch();

  const user = useSelector((state: any) => state.auth.currentUser);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (user && user.role) {
      setReady(true);
    }
  }, [user]);

  if (!ready) {
    return <div className="p-5 text-lg font-medium">Loading Sidebar...</div>;
  }

  const isSubadmin = user?.role === 'subadmin';

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-700">
      {/* Sidebar */}
      <Sidebar 
        collapsed={selector.collapsed} 
        breakPoint="lg" 
        toggled={selector.toggle}
        backgroundColor="#ffffffcc"
        className="shadow-md border-r border-gray-200 backdrop-blur-md"
      >
        <Menu 
          menuItemStyles={{
            button: {
              padding: '12px 20px',
              color: '#374151',
              fontWeight: 500,
              borderRadius: '8px',
              margin: '8px',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#eef2ff',
                color: '#4338ca',
              },
            },
          }}
        >
          {/* Collapse/Expand Button */}
          <MenuItem 
            className="lg:hidden" 
            onClick={() => dispatch(toggleSidebar())}
            icon={selector.toggle ? <IoIosArrowDropright size={24} /> : <IoIosArrowDropleft size={24} />}
          >
            {selector.toggle ? '' : 'Collapse'}
          </MenuItem>

          {/* Main Menu */}
          {isSubadmin ? (
            <>
              <MenuItem component={<Link to="/invoice-builder" />} icon={<FaFileInvoice size={22} />}>
                DJ Invoice
              </MenuItem>
              <MenuItem component={<Link to="/invoice-builder-2" />} icon={<FaFileInvoice size={22} />}>
                HT Invoice
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem component={<Link to="/" />} icon={<MdOutlineSpaceDashboard size={22} />}>
                Dashboard
              </MenuItem>
              <MenuItem component={<Link to="/purchase-items" />} icon={<BiSolidPurchaseTag size={22} />}>
                Inventory
              </MenuItem>
              <MenuItem component={<Link to="/add-product" />} icon={<AiOutlinePlus size={22} />}>
                Add Product
              </MenuItem>
              <MenuItem component={<Link to="/my-product" />} icon={<MdProductionQuantityLimits size={22} />}>
                My Products
              </MenuItem>
              <MenuItem component={<Link to="/invoice-builder" />} icon={<FaFileInvoice size={22} />}>
                DJ Invoice
              </MenuItem>
              <MenuItem component={<Link to="/my-bills" />} icon={<RiBillLine size={22} />}>
                DJ Bills
              </MenuItem>
              <MenuItem component={<Link to="/invoice-builder-2" />} icon={<FaFileInvoice size={22} />}>
                HT Invoice
              </MenuItem>
              <MenuItem component={<Link to="/shreesai-bills" />} icon={<RiBillLine size={22} />}>
                HT Bills
              </MenuItem>
            </>
          )}
        </Menu>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
