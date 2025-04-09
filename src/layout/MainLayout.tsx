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
    // console.log("🔍 Inside useEffect | Redux User:", user);
    // Wait until user role is available
    if (user && user.role) {
      setReady(true);
    }
  }, [user]);

  // console.log("🔥 Outside | Redux User:", user);

  if (!ready) {
    return <div className="p-5 text-lg font-medium">Loading Sidebar...</div>;
  }

  const isSubadmin = user?.role === 'subadmin';

  return (
    <>
      <div className="flex items-start lg:gap-x-2">
        <Sidebar collapsed={selector.collapsed} breakPoint="lg" toggled={selector.toggle}>
          <Menu>
            <MenuItem className="lg:hidden" onClick={() => dispatch(toggleSidebar())}>
              {selector.toggle ? <IoIosArrowDropright className="text-2xl" /> : <IoIosArrowDropleft className="text-2xl" />}
            </MenuItem>

            {isSubadmin ? (
              <>
                <MenuItem component={<Link to="/invoice-builder-2" />} icon={<FaFileInvoice className="text-2xl" />}>
                  DJInvoice
                </MenuItem>
                <MenuItem component={<Link to="/shreesai-bills" />} icon={<FaFileInvoice className="text-2xl" />}>
                  SSInvoice
                </MenuItem>
              </>
            ) : (
              <>
                <MenuItem component={<Link to="/" />} icon={<MdOutlineSpaceDashboard className="text-2xl" />}>
                  Dashboard
                </MenuItem>
                <MenuItem component={<Link to="/purchase-items" />} icon={<BiSolidPurchaseTag className="text-2xl" />}>
                  Inventory
                </MenuItem>
                <MenuItem component={<Link to="/add-product" />} icon={<AiOutlinePlus className="text-2xl" />}>
                  Add Product
                </MenuItem>
                <MenuItem component={<Link to="/my-product" />} icon={<MdProductionQuantityLimits className="text-2xl" />}>
                  My Products
                </MenuItem>
                <MenuItem component={<Link to="/invoice-builder" />} icon={<FaFileInvoice className="text-2xl" />}>
                  DJInvoice
                </MenuItem>
                <MenuItem component={<Link to="/my-bills" />} icon={<RiBillLine className="text-2xl" />}>
                  DJBills
                </MenuItem>
                <MenuItem component={<Link to="/invoice-builder-2" />} icon={<FaFileInvoice className="text-2xl" />}>
                  HTINVOICE
                </MenuItem>
                <MenuItem component={<Link to="/shreesai-bills" />} icon={<RiBillLine className="text-2xl" />}>
                  HTBills
                </MenuItem>
              </>
            )}
          </Menu>
        </Sidebar>

        <div className="w-full">
          {children}
        </div>
      </div>
    </>
  );
};

export default MainLayout;
