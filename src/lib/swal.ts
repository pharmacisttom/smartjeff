import Swal, { SweetAlertOptions } from "sweetalert2";

// Custom Tailwind-matching SweetAlert2 Helper
export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: "success",
    confirmButtonColor: "#059669", // emerald-600
    confirmButtonText: "ตกลง",
    customClass: {
      popup: "rounded-3xl border border-surface-border bg-surface-card shadow-2xl font-sans",
      title: "text-lg font-bold text-content-primary",
      htmlContainer: "text-sm text-content-secondary",
      confirmButton: "px-6 py-2.5 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md",
    },
  });
};

export const showError = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: "error",
    confirmButtonColor: "#e11d48", // rose-600
    confirmButtonText: "ตกลon",
    customClass: {
      popup: "rounded-3xl border border-surface-border bg-surface-card shadow-2xl font-sans",
      title: "text-lg font-bold text-content-primary",
      htmlContainer: "text-sm text-content-secondary",
      confirmButton: "px-6 py-2.5 rounded-2xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md",
    },
  });
};

export const showWarning = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: "warning",
    confirmButtonColor: "#d97706", // amber-600
    confirmButtonText: "รับทราบ",
    customClass: {
      popup: "rounded-3xl border border-surface-border bg-surface-card shadow-2xl font-sans",
      title: "text-lg font-bold text-content-primary",
      htmlContainer: "text-sm text-content-secondary",
      confirmButton: "px-6 py-2.5 rounded-2xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-md",
    },
  });
};

export const showConfirm = async (title: string, text: string, confirmText = "ยืนยัน", cancelText = "ยกเลิก") => {
  const result = await Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#2563eb", // brand-600
    cancelButtonColor: "#64748b", // slate-500
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    customClass: {
      popup: "rounded-3xl border border-surface-border bg-surface-card shadow-2xl font-sans",
      title: "text-lg font-bold text-content-primary",
      htmlContainer: "text-sm text-content-secondary",
      confirmButton: "px-6 py-2.5 rounded-2xl font-bold text-sm bg-brand-600 hover:bg-brand-700 text-white shadow-md ml-2",
      cancelButton: "px-6 py-2.5 rounded-2xl font-bold text-sm bg-slate-500 hover:bg-slate-600 text-white shadow-md",
    },
  });
  return result.isConfirmed;
};

export const showToast = (title: string, icon: "success" | "error" | "info" | "warning" = "success") => {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
    customClass: {
      popup: "rounded-2xl border border-surface-border bg-surface-card shadow-xl font-sans py-2 px-4 text-xs font-bold text-content-primary",
    },
  });
  Toast.fire({
    icon,
    title,
  });
};

export const showLoading = (title = "กำลังดำเนินการ...", text = "กรุณารอสักครู่") => {
  Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
    customClass: {
      popup: "rounded-3xl border border-surface-border bg-surface-card shadow-2xl font-sans",
      title: "text-lg font-bold text-content-primary",
      htmlContainer: "text-sm text-content-secondary",
    },
  });
};

export const closeSwal = () => {
  Swal.close();
};

export default Swal;
