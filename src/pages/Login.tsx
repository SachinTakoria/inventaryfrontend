import { ErrorMessage, Field, Formik } from 'formik'
import { Button } from 'primereact/button'
import { Link, useNavigate } from 'react-router-dom'
import * as yup from 'yup'
import { useLoginUserMutation } from '../provider/queries/Auth.query'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { setUser } from '../provider/slice/user.slice'

const Login = () => {
  const [LoginUser, LoginUserResponse] = useLoginUserMutation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  type User = {
    email: string
    password: string
    token: string
  }

  const initialValues: User = {
    email: '',
    password: '',
    token: 'dummy' 
  }

  const validationSchema = yup.object({
    email: yup.string().email("email must be valid").required("email is required"),
    password: yup.string().min(5, "Password must be greater than 5 characters").required("password is required"),
  })

  const OnSubmitHandler = async (e: User, { resetForm }: any) => {
    try {
      const { data, error }: any = await LoginUser(e)

      if (error) {
        toast.error(error.data?.message || "Login failed")
        return
      }

      localStorage.setItem("token", data.token)
      dispatch(setUser(data.user))
      localStorage.setItem("user", JSON.stringify(data.user))
      toast.success("Login successful!")
      resetForm()

      if (data.user.role === "admin") {
        navigate("/")
      } else if (data.user.role === "subadmin") {
        navigate("/subadmin/dashboard")
      } else {
        toast.error("Invalid role")
      }

    } catch (error: any) {
      toast.error(error.message || "Something went wrong during login.")
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center w-full bg-[#eee]'>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={OnSubmitHandler}>
        {({ handleSubmit }) => (
          <form onSubmit={handleSubmit} className="w-[96%] md:w-[70%] lg:w-1/3 shadow-md rounded-md pt-10 pb-3 px-4 bg-white">
            <div className="mb-3 py-1">
              <label htmlFor="email">Email</label>
              <Field id='email' name='email' className='w-full outline-none py-3 px-2 border-[.1px] border-zinc-400 rounded-lg' placeholder='Enter Email Address' />
              <ErrorMessage component='p' className='text-red-500 text-sm' name='email' />
            </div>
            <div className="mb-3 py-1">
              <label htmlFor="password">Password</label>
              <Field name='password' id='password' className='w-full outline-none py-3 px-2 border-[.1px] border-zinc-400 rounded-lg' placeholder='*****' />
              <ErrorMessage component='p' className='text-red-500 text-sm' name='password' />
            </div>
            <div className="mb-3 py-1 flex items-center justify-center">
              <Button loading={LoginUserResponse.isLoading} className='w-full bg-red-500 text-white py-3 px-2 flex items-center justify-center'>
                Submit
              </Button>
            </div>
            <div className="mb-3 py-1 flex items-center justify-end">
              <p className="inline-flex items-center gap-x-1">Don't Have An Account?<Link className='font-semibold' to={'/register'}>Register</Link></p>
            </div>
            <div className="mb-3 py-1 flex items-center justify-end">
              <p className="inline-flex items-center gap-x-1">Forget<Link className='font-semibold' to={'#'}>Password ?</Link></p>
            </div>
          </form>
        )}
      </Formik>
    </div>
  )
}

export default Login
