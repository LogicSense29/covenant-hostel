"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  ShieldCheck, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Lock,
  Phone,
  Mail,
  Loader2
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "TENANT",
    isStudent: false,
    matricNumber: "",
    studentIdUrl: "",
    schoolName: "",
    department: "",
    faculty: "",
    courseOfStudy: "",
    schoolYear: "",
    permanentAddress: "",
    guarantorName: "",
    guarantorPhone: "",
    guarantorAddress: "",
    guarantorRelationship: "",
    guarantorIdUrl: "",
    workType: "Employee",
    companyName: "",
    workAddress: "",
    workIdUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [registered, setRegistered] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleFileUpload = async (e, targetField = "guarantorIdUrl") => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading("Uploading document...");

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      if (result.success) {
        setFormData({ ...formData, [targetField]: result.fileUrl });
        toast.success("Uploaded successfully!", { id: toastId });
      } else {
        toast.error(result.error || "Upload failed", { id: toastId });
      }
    } catch (err) {
      toast.error("An error occurred during upload", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        return toast.error("Please fill all account information");
      }
      if (formData.role !== "TENANT") {
        setStep(3); // Go to Security
      } else if (formData.isStudent) {
        setStep(1.5); // Go to Student Details
      } else {
        setStep(1.6); // Go to Work Details
      }
    } else if (step === 1.5) {
        if (!formData.matricNumber || !formData.schoolName || !formData.courseOfStudy || !formData.studentIdUrl || !formData.permanentAddress) {
            return toast.error("Please provide all student and permanent address details");
        }
        setStep(2);
    } else if (step === 1.6) {
        if (!formData.workType || !formData.companyName || !formData.workAddress) {
            return toast.error("Please provide all work details");
        }
        handleSubmitInternal();
    } else if (step === 2) {
      if (!formData.guarantorName || !formData.guarantorPhone || !formData.guarantorAddress || !formData.guarantorIdUrl || !formData.guarantorRelationship) {
        return toast.error("Please provide all guarantor details and relationship");
      }
      handleSubmitInternal();
    }
  };

  const prevStep = () => {
    if (step === 2) {
        if (formData.isStudent) {
            setStep(1.5);
        } else {
            setStep(1.6);
        }
    } else if (step === 1.5 || step === 1.6) {
        setStep(1);
    } else {
        setStep(1);
    }
  };

  const handleSubmitInternal = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        if (formData.role === "TENANT") {
          setRegistered(true);
          toast.success("Application submitted!");
        } else {
          toast.success("Account created successfully!");
          setTimeout(() => router.push("/login"), 1500);
        }
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: "Personal", id: 1 },
    { title: "Student", id: 1.5, hide: !formData.isStudent },
    { title: "Employment", id: 1.6, hide: formData.isStudent || formData.role !== "TENANT" },
    { title: formData.role === "TENANT" ? "Guarantor" : "Security", id: 2, hide: formData.role === "TENANT" && !formData.isStudent },
  ].filter(s => !s.hide);

  if (registered) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
        <div className="w-full max-w-[480px] bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center animate-in zoom-in duration-300">
           <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-6 mx-auto">
              <CheckCircle2 size={32} />
           </div>
           <h2 className="text-2xl font-bold text-slate-900 mb-3">Application Received!</h2>
           <p className="text-slate-500 mb-8 leading-relaxed">
             Thank you for registering. Your details and guarantor information have been submitted for review. 
             <br /><br />
             Once approved, you will receive an email with a <strong>link to set your password</strong> and activate your account.
           </p>
           <button 
             onClick={() => router.push("/")}
             className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
           >
             Return Home
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-8">
           <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm mb-4">
              <ShieldCheck size={24} />
           </div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h1>
           <p className="text-sm text-slate-500 mt-1 font-medium">Join Covenant Hostel Management System</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
          <div className="flex h-1.5 w-full bg-slate-100">
            {steps.map((s, i) => {
              const isActive = step >= s.id;
              return (
                <div 
                  key={s.id} 
                  className={`flex-1 transition-all duration-500 ${isActive ? "bg-blue-600" : "bg-transparent"}`}
                />
              );
            })}
          </div>

          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                Step {steps.findIndex(s => s.id === step) + 1} of {steps.length}
              </span>
              <span className="text-sm font-bold text-slate-900">
                {step === 1 ? "Personal Info" : step === 1.5 ? "Student Details" : step === 1.6 ? "Work Details" : (formData.role === "TENANT" ? "Guarantor & ID" : "Password Security")}
              </span>
            </div>

            <main className="space-y-5">
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input required name="name" type="text" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="Samuel Adekunle" value={formData.name} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input required name="email" type="email" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="samuel@hostel.com" value={formData.email} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input required name="phone" type="tel" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="080 000 0000" value={formData.phone} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${formData.isStudent ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                           <ShieldCheck size={18} />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-900">Are you a Student?</p>
                           <p className="text-[10px] text-slate-500">Enable for academic details</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input name="isStudent" type="checkbox" className="sr-only peer" checked={formData.isStudent} onChange={handleChange} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {step === 1.5 && formData.isStudent && (
                 <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">School Name</label>
                        <input name="schoolName" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-all text-sm font-semibold text-slate-900" placeholder="Enter institution name" value={formData.schoolName} onChange={handleChange} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Matric Number</label>
                            <input name="matricNumber" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-all text-sm font-semibold text-slate-900" placeholder="e.g. 19/..." value={formData.matricNumber} onChange={handleChange} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">School Year</label>
                            <input name="schoolYear" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-all text-sm font-semibold text-slate-900" placeholder="e.g. 400L" value={formData.schoolYear} onChange={handleChange} />
                        </div>
                    </div>


                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Faculty</label>
                            <input name="faculty" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-all text-sm font-semibold text-slate-900" placeholder="e.g. Engineering" value={formData.faculty} onChange={handleChange} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Department</label>
                            <input name="department" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-all text-sm font-semibold text-slate-900" placeholder="e.g. Civil Eng" value={formData.department} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Course of Study</label>
                        <input name="courseOfStudy" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-all text-sm font-semibold text-slate-900" placeholder="Enter course" value={formData.courseOfStudy} onChange={handleChange} />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Permanent Address</label>
                        <textarea name="permanentAddress" rows="2" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-all text-sm font-semibold text-slate-900 resize-none" placeholder="Residential address outside school" value={formData.permanentAddress} onChange={handleChange} />
                    </div>

                    <div className="space-y-1.5 pt-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Student ID Card</label>
                        <label className={`block border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer text-center ${
                        formData.studentIdUrl ? "border-green-500 bg-green-50/50" : "border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400"
                        }`}>
                        {uploading ? (
                            <Loader2 className="text-blue-600 animate-spin mx-auto" size={20} />
                        ) : formData.studentIdUrl ? (
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle2 className="text-green-600" size={20} />
                                <span className="text-xs font-bold text-green-600">ID Uploaded</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <Upload className="text-slate-400" size={20} />
                                <span className="text-xs font-bold text-slate-600">Upload Student ID</span>
                            </div>
                        )}
                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, "studentIdUrl")} />
                        </label>
                    </div>
                </div>
              )}

              {step === 1.6 && !formData.isStudent && formData.role === "TENANT" && (
                 <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Work Type</label>
                        <select 
                          name="workType" 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-all text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500"
                          value={formData.workType} 
                          onChange={handleChange}
                        >
                          <option value="Employee">Employee</option>
                          <option value="Self employed/Worker">Self employed/Worker</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Company / Business Name</label>
                        <div className="relative group">
                          <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                          <input 
                            name="companyName" 
                            type="text" 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-all text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500" 
                            placeholder="Enter workplace name" 
                            value={formData.companyName} 
                            onChange={handleChange} 
                          />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Work Address</label>
                        <div className="relative group">
                          <MapPin className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                          <textarea 
                            name="workAddress" 
                            rows="3" 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-all text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 resize-none" 
                            placeholder="Full address of your workplace" 
                            value={formData.workAddress} 
                            onChange={handleChange} 
                          />
                        </div>
                    </div>

                    {formData.workType === "Employee" && (
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                          Work ID Card <span className="font-normal text-slate-400 normal-case">(Optional)</span>
                        </label>
                        <label className={`block border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer text-center ${
                          formData.workIdUrl ? "border-green-500 bg-green-50/50" : "border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400"
                        }`}>
                          {uploading ? (
                            <Loader2 className="text-blue-600 animate-spin mx-auto" size={20} />
                          ) : formData.workIdUrl ? (
                            <div className="flex items-center justify-center gap-2">
                              <CheckCircle2 className="text-green-600" size={20} />
                              <span className="text-xs font-bold text-green-600">Work ID Uploaded</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <Upload className="text-slate-400" size={20} />
                              <span className="text-xs font-bold text-slate-600">Upload Work ID</span>
                            </div>
                          )}
                          <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, "workIdUrl")} />
                        </label>
                      </div>
                    )}
                 </div>
              )}

              {step === 2 && formData.role === "TENANT" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      

                  <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Guarantor Name</label>
                    <input required name="guarantorName" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="Full name of guarantor" value={formData.guarantorName} onChange={handleChange} />
                  </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone</label>
                      <input required name="guarantorPhone" type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="080..." value={formData.guarantorPhone} onChange={handleChange} />
                    </div>

                                                        <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Relationship</label>
                    <div className="relative group">
                       <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
                       <input required name="guarantorRelationship" type="text" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="e.g. Father" value={formData.guarantorRelationship} onChange={handleChange} />
                    </div>
                  </div>
                  </div>

                                    <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Residential Address</label>
                    <div className="relative">
                      <textarea 
                        required 
                        name="guarantorAddress" 
                        rows="3" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900 resize-none" 
                        placeholder="House Number, Street Name, City, State" 
                        value={formData.guarantorAddress} 
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Guarantor Valid ID Card</label>
                    <label className={`block border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer text-center ${
                      formData.guarantorIdUrl ? "border-green-500 bg-green-50/50" : "border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400"
                    }`}>
                      {uploading ? (
                         <div className="flex flex-col items-center gap-2">
                            <Loader2 className="text-blue-600 animate-spin" size={24} />
                            <span className="text-[10px] font-bold text-blue-600 uppercase">Uploading...</span>
                         </div>
                      ) : formData.guarantorIdUrl ? (
                         <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="text-green-600" size={24} />
                            <span className="text-[10px] font-bold text-green-600 uppercase">File Uploaded</span>
                            <span className="text-[9px] text-slate-400 underline">Click to replace</span>
                         </div>
                      ) : (
                         <div className="flex flex-col items-center gap-2">
                            <Upload className="text-slate-400" size={24} />
                            <span className="text-[11px] font-bold text-slate-600">Select Image/PDF</span>
                            <span className="text-[9px] text-slate-400">Passport, License or NIN</span>
                         </div>
                      )}
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, "guarantorIdUrl")} />
                    </label>
                  </div>
                </div>
              )}

              {step === 3 && formData.role !== "TENANT" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Create Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input required name="password" type="password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="Minimum 6 characters" value={formData.password} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input required name="confirmPassword" type="password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                {step > 1 && (
                  <button onClick={prevStep} disabled={loading} className="px-5 py-3 h-12 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                    <ArrowLeft size={18} />
                  </button>
                )}
                
                <button 
                  onClick={nextStep} 
                  disabled={loading || uploading}
                  className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-2 group disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      { (step === 1 || step === 1.5 || step === 1.6) ? "Continue" : (formData.role === "TENANT" ? "Submit Application" : "Complete Registration")}
                      { (step === 1 || step === 1.5 || step === 1.6) && <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />}
                    </>
                  )}
                </button>
              </div>
            </main>
          </div>
        </div>

        <p className="mt-8 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">
          Already a member? <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-all ml-1 underline underline-offset-4">Log In</Link>
        </p>
      </div>
    </div>
  );
}
