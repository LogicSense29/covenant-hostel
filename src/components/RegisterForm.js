"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Loader2,
  Building2,
  Eye,
  EyeOff
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const resumeEmail = searchParams.get("resume");
  const sharedBy = searchParams.get("sharedBy"); // primaryTenantId when joining as a room sharer

  const [step, setStep] = useState(1);
  const [roomInfo, setRoomInfo] = useState(null);
  const [draftRestored, setDraftRestored] = useState(false);
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredProfileId, setRegisteredProfileId] = useState(null); // profile ID returned after registration
  const [rulesAgreed, setRulesAgreed] = useState(false);
  const [blocksData, setBlocksData] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");

  useEffect(() => {
    if (roomId) return;
    fetch("/api/public/blocks-rooms")
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (data) setBlocksData(data); })
      .catch(() => {});
  }, [roomId]);

  // Fetch room info if coming from a room page
  useEffect(() => {
    if (!roomId) return;
    fetch(`/api/rooms/${roomId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRoomInfo(data); })
      .catch(() => {});
  }, [roomId]);

  // Restore draft when ?resume=email is in the URL
  useEffect(() => {
    if (!resumeEmail || draftRestored) return;
    fetch(`/api/registration-draft?email=${encodeURIComponent(resumeEmail)}`)
      .then(r => r.ok ? r.json() : null)
      .then(draft => {
        if (draft?.data) {
          setFormData(prev => ({ ...prev, ...draft.data }));
          if (draft.step) setStep(draft.step);
          setDraftRestored(true);
          toast.success("Your progress has been restored. Continue where you left off.");
        }
      })
      .catch(() => {});
  }, [resumeEmail, draftRestored]);

  // Auto-save draft whenever formData changes (debounced, only after email is entered)
  // Passwords are deliberately excluded from the saved draft.
  useEffect(() => {
    if (!formData.email || !formData.email.includes("@")) return;
    const timer = setTimeout(() => {
      const { password, confirmPassword, ...safeData } = formData;
      fetch("/api/registration-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, data: safeData, step }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData, step]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle phone number fields with +234 prefix
    if (name === "phone" || name === "guarantorPhone") {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, "");
      
      // If user is typing and has digits
      if (digitsOnly.length > 0) {
        // Remove +234 prefix if present to get the actual number
        let phoneNumber = digitsOnly;
        if (phoneNumber.startsWith("234")) {
          phoneNumber = phoneNumber.substring(3);
        }
        
        // Limit to 10 digits (Nigerian phone numbers)
        phoneNumber = phoneNumber.substring(0, 10);
        
        // Format with +234 prefix
        setFormData({
          ...formData,
          [name]: phoneNumber ? `+234${phoneNumber}` : ""
        });
      } else {
        setFormData({
          ...formData,
          [name]: ""
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value
      });
    }
  };

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation function
  const validatePhone = (phone) => {
    // Should be +234 followed by 10 digits
    const phoneRegex = /^\+234\d{10}$/;
    return phoneRegex.test(phone);
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
      
      // Validate email
      if (!validateEmail(formData.email)) {
        return toast.error("Please enter a valid email address");
      }
      
      // Validate phone
      if (!validatePhone(formData.phone)) {
        return toast.error("Please enter a valid 10-digit phone number");
      }
      
      if (formData.role !== "TENANT") {
        handleSubmitInternal(); // Submit directly since password is set via email
      } else {
        if (!roomId && blocksData.length > 0 && (!selectedBlockId || !selectedRoomId)) {
          return toast.error("Please select a block and room");
        }
        if (formData.isStudent) {
          setStep(1.5); // Go to Student Details
        } else {
          setStep(1.6); // Go to Work Details
        }
      }
    } else if (step === 1.5) {
        if (!formData.matricNumber || !formData.schoolName || !formData.faculty || !formData.department || !formData.courseOfStudy || !formData.schoolYear || !formData.studentIdUrl || !formData.permanentAddress) {
            return toast.error("Please provide all student and permanent address details");
        }
        setStep(2);
    } else if (step === 1.6) {
        if (!formData.workType || !formData.companyName || !formData.workAddress) {
            return toast.error("Please provide all work details");
        }
        if (!rulesAgreed) return toast.error("Please agree to the Tenancy Rules and Regulations");
        handleSubmitInternal();
    } else if (step === 2) {
      if (!formData.guarantorName || !formData.guarantorPhone || !formData.guarantorAddress || !formData.guarantorIdUrl || !formData.guarantorRelationship) {
        return toast.error("Please provide all guarantor details and relationship");
      }
      
      // Validate guarantor phone
      if (!validatePhone(formData.guarantorPhone)) {
        return toast.error("Please enter a valid 10-digit guarantor phone number");
      }
      
      if (!rulesAgreed) return toast.error("Please agree to the Tenancy Rules and Regulations");
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
        body: JSON.stringify({
          ...formData,
          roomId: roomId || selectedRoomId || null,
          primaryTenantId: sharedBy || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (formData.role === "TENANT") {
          // Clean up the draft — registration complete
          fetch(`/api/registration-draft?email=${encodeURIComponent(formData.email)}`, { method: "DELETE" }).catch(() => {});
          // Store the profile ID so the success screen can build a correct share link
          if (data.profileId) setRegisteredProfileId(data.profileId);
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
           <p className="text-slate-500 mb-6 leading-relaxed">
             Thank you for registering. Your details and guarantor information have been submitted for review. 
             <br /><br />
             Once approved, you will receive an email with a <strong>link to set your password</strong> and activate your account.
           </p>

           {/* Share room link — only shown when NOT registering as a sharer and a room was selected */}
           {!sharedBy && (roomId || selectedRoomId) && registeredProfileId && (
             <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-left space-y-3">
               <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">Sharing this room?</p>
               <p className="text-xs text-blue-600 leading-relaxed">
                 If someone else will be sharing your room, copy and send them this link to complete their own registration.
               </p>
               <button
                 type="button"
                 onClick={() => {
                   const base = typeof window !== "undefined" ? window.location.origin : "";
                   // Include &sharedBy=profileId so the new registrant is correctly linked to this primary tenant
                   const link = `${base}/register?roomId=${roomId || selectedRoomId}&sharedBy=${registeredProfileId}`;
                   navigator.clipboard.writeText(link).then(() => toast.success("Share link copied!"));
                 }}
                 className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
               >
                 Copy Room Share Link
               </button>
             </div>
           )}

           <button 
             onClick={() => router.push("/")}
             className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
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

        {/* Draft restored banner */}
        {draftRestored && (
          <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
            <span className="text-xs font-bold text-green-700">✓ Your previous progress has been restored. Continue where you left off.</span>
          </div>
        )}

        {/* Room reservation banner */}
        {roomInfo && (
          <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
            <div className="p-2 bg-[#0b69ff] rounded-xl shrink-0">
              <Building2 size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-[#0b69ff] uppercase tracking-widest">Reserving</p>
              <p className="text-sm font-bold text-[#102a43] truncate">
                Room {roomInfo.roomNumber}{roomInfo.block?.name ? ` · ${roomInfo.block.name}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Room sharer banner — shown when ?sharedBy= is in the URL */}
        {sharedBy && (
          <div className="mb-6 flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3">
            <div className="p-2 bg-purple-600 rounded-xl shrink-0">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-purple-700 uppercase tracking-widest">Room Sharing</p>
              <p className="text-sm font-semibold text-purple-900">
                You are registering as a room sharer. Your billing will be managed by the primary tenant.
              </p>
            </div>
          </div>
        )}

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
                  {!roomId && formData.role === "TENANT" && blocksData.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Block</label>
                        <select 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900"
                          value={selectedBlockId}
                          onChange={(e) => {
                            setSelectedBlockId(e.target.value);
                            setSelectedRoomId("");
                          }}
                        >
                          <option value="">Select Block</option>
                          {blocksData.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Room</label>
                        <select 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900"
                          value={selectedRoomId}
                          onChange={(e) => setSelectedRoomId(e.target.value)}
                          disabled={!selectedBlockId}
                        >
                          <option value="">Select Room</option>
                          {selectedBlockId && blocksData.find(b => b.id === selectedBlockId)?.rooms.map(r => (
                            <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

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
                      <input 
                        required 
                        name="email" 
                        type="email" 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" 
                        placeholder="samuel@example.com" 
                        value={formData.email} 
                        onChange={handleChange}
                      />
                    </div>
                    {formData.email && !validateEmail(formData.email) && (
                      <p className="text-[10px] text-red-500 ml-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500"></span>
                        Please enter a valid email address
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors flex items-center gap-1">
                        <Phone size={18} />
                        <span className="text-xs font-bold">+234</span>
                      </div>
                      <input 
                        required 
                        name="phone" 
                        type="tel" 
                        className="w-full pl-20 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" 
                        placeholder="7061608636" 
                        value={formData.phone.replace("+234", "")} 
                        onChange={handleChange}
                        maxLength={10}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 ml-1">Enter 10-digit phone number without +234</p>
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
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors flex items-center gap-1">
                          <Phone size={14} />
                          <span className="text-xs font-bold">+234</span>
                        </div>
                        <input 
                          required 
                          name="guarantorPhone" 
                          type="tel" 
                          className="w-full pl-20 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" 
                          placeholder="8012345678" 
                          value={formData.guarantorPhone.replace("+234", "")} 
                          onChange={handleChange}
                          maxLength={10}
                        />
                      </div>
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



              {/* Rules agreement — shown on final step for tenants */}
              {formData.role === "TENANT" && (step === 2 || step === 1.6) && (
                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="rulesAgreed"
                    checked={rulesAgreed}
                    onChange={(e) => setRulesAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer shrink-0"
                  />
                  <label htmlFor="rulesAgreed" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                    I agree to the{" "}
                    <a href="/tenant/rules" target="_blank" className="text-blue-600 font-bold hover:underline">
                      Tenancy Rules and Regulations
                    </a>
                  </label>
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
