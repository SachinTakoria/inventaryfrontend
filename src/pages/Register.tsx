import { ErrorMessage, Field, Formik } from 'formik';
import { Button } from 'primereact/button';
import { Link, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { useRegisterUserMutation } from '../provider/queries/Auth.query';
import { toast } from 'sonner';

const Register = () => {
  const [registerUser, registerUserResponse] = useRegisterUserMutation();
  const navigate = useNavigate();

  type User = {
    name: string;
    email: string;
    password: string;
    token: string;
  };

  const initialValues: User = {
    name: '',
    email: '',
    password: '',
    token: 'dummy',
  };

  const validationSchema = yup.object({
    name: yup.string().required("Name is required"),
    email: yup.string().email("Email must be valid").required("Email is required"),
    password: yup
      .string()
      .min(5, "Password must be greater than 5 characters")
      .required("Password is required"),
  });

  const OnSubmitHandler = async (e: User, { resetForm }: any) => {
    try {
      const { data, error }: any = await registerUser(e);

      if (error) {
        toast.error(error.data.message);
        return;
      }

      localStorage.setItem("token", data.token);
      resetForm();
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1f2937] via-[#111827] to-[#0f172a] px-4">

      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={OnSubmitHandler}>
        {({ handleSubmit }) => (
          <form
            onSubmit={handleSubmit}
            className="w-[96%] sm:w-[80%] md:w-[60%] lg:w-[35%] bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 animate-fade-in"
          >
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
              Create Your Account <span className="text-3xl">🎉</span>
            </h2>

            <div className="mb-5">
              <label htmlFor="name" className="block font-medium mb-1">
                Full Name
              </label>
              <Field
                id="name"
                name="name"
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring focus:ring-blue-300 outline-none"
              />
              <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div className="mb-5">
              <label htmlFor="email" className="block font-medium mb-1">
                Email Address
              </label>
              <Field
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring focus:ring-blue-300 outline-none"
              />
              <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block font-medium mb-1">
                Password
              </label>
              <Field
                name="password"
                id="password"
                type="password"
                placeholder="********"
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring focus:ring-blue-300 outline-none"
              />
              <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            {/* ✅ Centered Button */}
<div className="mt-4 flex justify-center">
  <Button
    loading={registerUserResponse.isLoading}
    type="submit"
    className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-all"
  >
    Register
  </Button>
</div>


            <div className="mt-6 text-sm text-center">
              Already have an account?{' '}
              <Link to='/login' className="text-blue-600 font-semibold hover:underline">
                Login
              </Link>
            </div>
          </form>
        )}
      </Formik>
    </div>
  );
};

export default Register;