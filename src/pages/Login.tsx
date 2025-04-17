import { ErrorMessage, Field, Formik } from 'formik';
import { Button } from 'primereact/button';
import { Link, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { useLoginUserMutation } from '../provider/queries/Auth.query';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { setUser } from '../provider/slice/user.slice';

const Login = () => {
  const [LoginUser, LoginUserResponse] = useLoginUserMutation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  type User = {
    email: string;
    password: string;
    token: string;
  };

  const initialValues: User = {
    email: '',
    password: '',
    token: 'dummy',
  };

  const validationSchema = yup.object({
    email: yup.string().email('Please enter a valid email').required('Email is required'),
    password: yup.string().min(5, 'Password must be at least 5 characters').required('Password is required'),
  });

  const OnSubmitHandler = async (e: User, { resetForm }: any) => {
    try {
      const { data, error }: any = await LoginUser(e);

      if (error) {
        toast.error(error.data?.message || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      dispatch(setUser(data.user));
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Login successful!');
      resetForm();

      if (data.user.role === 'admin') {
        navigate('/');
      } else if (data.user.role === 'subadmin') {
        navigate('/subadmin/dashboard');
      } else {
        toast.error('Invalid role');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong during login.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1f2937] via-[#111827] to-[#0f172a] px-4">
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={OnSubmitHandler}>
        {({ handleSubmit }) => (
          <form
            onSubmit={handleSubmit}
            className="w-full sm:w-[400px] bg-white rounded-2xl shadow-2xl px-8 py-10 animate-fade-in"
          >
            <h2 className="text-center text-3xl font-extrabold text-gray-800 mb-6 tracking-wide">
              Sign in to Your Account 🔐
            </h2>

            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Field
                id="email"
                name="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <ErrorMessage component="div" name="email" className="text-sm text-red-500 mt-1" />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Field
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <ErrorMessage component="div" name="password" className="text-sm text-red-500 mt-1" />
            </div>

            <Button
              type="submit"
              label="Login"
              loading={LoginUserResponse.isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold shadow-lg"
            />

            <div className="mt-6 text-sm flex justify-between text-gray-600">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:underline font-medium">
                  Register
                </Link>
              </p>
              <Link to="#" className="text-blue-600 hover:underline font-medium">
                Forgot Password?
              </Link>
            </div>
          </form>
        )}
      </Formik>
    </div>
  );
};

export default Login;
