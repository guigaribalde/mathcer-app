"use client";

import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";

export default function Home() {
  const router = useRouter();
  const formik = useFormik({
    initialValues: {
      id: "",
    },
    validationSchema: Yup.object({
      id: Yup.string().required("Room id is required"),
    }),
    onSubmit: ({ id }) => {
      return router.push(`/room?id=${id}`);
    },
  });

  return (
    <div className="flex justify-center items-center w-full h-full bg-gray-50">
      <form className="flex flex-col gap-2 w-96" onSubmit={formik.handleSubmit}>
        <div className="w-full form-control">
          <label className="label">
            <span className="label-text">Room Id</span>
          </label>
          <input
            value={formik.values.id}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            type="text"
            placeholder="Room id"
            name="id"
            id="id"
            className={`w-full input input-bordered ${formik.errors.id && formik.touched.id ? "input-error" : ""
              }`}
          />
          {formik.errors.id && formik.touched.id && (
            <label className="label">
              <span className="text-red-600 label-text-alt">
                {formik.errors.id}
              </span>
            </label>
          )}
        </div>
        <button
          type="submit"
          className={`w-full btn btn-primary ${formik.isSubmitting || formik.isValidating ? "loading" : ""
            }`}
        >
          Create/Join room
        </button>
      </form>
    </div>
  );
}
