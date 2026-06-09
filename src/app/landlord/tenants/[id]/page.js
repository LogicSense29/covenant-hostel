import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Phone, Mail, GraduationCap,
  Briefcase, FileText, ShieldCheck, Calendar, Home
} from "lucide-react";
import ApprovalActions from "../ApprovalActions";
import AssignRoomActions from "../AssignRoomActions";
import PartialPaymentToggle from "@/components/PartialPaymentToggle";

export const dynamic = "force-dynamic";

export default async function TenantProfilePage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session || !["LANDLORD", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  const profile = await prisma.tenantProfile.findUnique({
    where: { id },
    include: {
      user: true,
      room: { include: { block: true } },
      stayHistory: {
        include: { room: { include: { block: true } } },
        orderBy: { startDate: "desc" },
      },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile) notFound();

  const availableRooms = await prisma.room.findMany({
    where: { NOT: { status: "UNDER_MAINTENANCE" } },
    include: { tenants: true, block: true },
    orderBy: { roomNumber: "asc" },
  });

  const status = profile.user?.status || "ACTIVE";
  const isSelfEmployed = profile.workType === "Self employed/Worker" && !profile.isStudent;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">

      {/* Back + Header */}
      <div className="space-y-4">
        <Link
          href="/landlord/tenants"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Directory
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl border border-blue-100 shrink-0">
              {profile.user?.name?.[0]?.toUpperCase() || "T"}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{profile.user?.name || "Unnamed"}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Phone size={12} /> {profile.phone}
                </span>
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Mail size={12} /> {profile.user?.email}
                </span>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {profile.isStudent
                  ? <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold"><GraduationCap size={10} /> Student</span>
                  : <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold"><Briefcase size={10} /> Professional</span>
                }
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold border border-slate-200">
                  {status.replace(/_/g, " ")}
                </span>
                {profile.rulesSigned && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold border border-emerald-100">
                    <ShieldCheck size={10} /> Rules Signed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Applied date */}
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applied</p>
            <p className="text-sm font-bold text-slate-700">{new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT — Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Personal / Academic / Work */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Primary Information</h2>
            </div>
            <div className="p-6 space-y-4">
              {profile.isStudent ? (
                <>
                  <Row label="Matric Number" value={profile.matricNumber} />
                  <Row label="School" value={profile.schoolName} />
                  <Row label="Year" value={profile.schoolYear} />
                  <Row label="Course" value={`${profile.courseOfStudy} (${profile.department}, ${profile.faculty})`} />
                </>
              ) : (
                <>
                  <Row label="Employment Type" value={profile.workType} />
                  <Row label="Company" value={profile.companyName} />
                  <Row label="Work Address" value={profile.workAddress} />
                </>
              )}
              {profile.permanentAddress && profile.permanentAddress.trim() !== "" && (
                <Row label="Permanent Address" value={profile.permanentAddress} />
              )}
            </div>
          </div>

          {/* Guarantor */}
          {profile.guarantorName && profile.guarantorName.trim() !== "" && profile.guarantorName.toLowerCase() !== "null" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-blue-50/40">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Guarantor</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Row label="Name" value={profile.guarantorName} />
                  <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 uppercase">
                    {profile.guarantorRelationship}
                  </span>
                </div>
                <Row label="Phone" value={profile.guarantorPhone} />
                {profile.guarantorAddress && <Row label="Address" value={profile.guarantorAddress} />}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Verification Documents</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.isStudent && profile.studentIdUrl && <DocCard href={profile.studentIdUrl} label="Student ID" icon={<GraduationCap size={14} />} />}
                {!profile.isStudent && profile.workType === "Employee" && profile.workIdUrl && <DocCard href={profile.workIdUrl} label="Work ID" icon={<Briefcase size={14} />} />}
                {profile.guarantorIdUrl && <DocCard href={profile.guarantorIdUrl} label="Guarantor ID" icon={<FileText size={14} />} />}
                {!profile.studentIdUrl && !profile.workIdUrl && !profile.guarantorIdUrl && (
                  <div className="col-span-3 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-bold">
                    No documents uploaded
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stay History */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Stay History</h2>
            </div>
            <div className="p-6">
              {!profile.stayHistory?.length ? (
                <p className="text-xs text-slate-400 text-center py-4">No stay history recorded.</p>
              ) : (
                <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-2">
                  {profile.stayHistory.map((stay) => (
                    <div key={stay.id} className="relative pl-4">
                      <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white" />
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800">
                          Room {stay.room?.roomNumber}{stay.room?.block?.name && ` · ${stay.room.block.name}`}
                        </p>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                          stay.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}>{stay.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {new Date(stay.startDate).toLocaleDateString()} — {stay.endDate ? new Date(stay.endDate).toLocaleDateString() : "Present"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Payment History</h2>
            </div>
            <div className="p-6">
              {!profile.payments?.length ? (
                <p className="text-xs text-slate-400 text-center py-4">No payments recorded.</p>
              ) : (
                <div className="space-y-2">
                  {profile.payments.map((pmt) => (
                    <div key={pmt.id} className="flex items-center justify-between bg-slate-50 rounded-2xl border border-slate-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">₦{pmt.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">{new Date(pmt.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {pmt.paymentType?.toLowerCase()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          pmt.status === "VERIFIED" || pmt.status === "SUCCESS" ? "bg-green-50 text-green-600 border-green-100"
                          : pmt.status === "PENDING" ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-red-50 text-red-600 border-red-100"
                        }`}>{pmt.status === "SUCCESS" ? "Confirmed" : pmt.status}</span>
                        {pmt.receiptUrl && (
                          <a href={pmt.receiptUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                            <FileText size={10} /> Receipt
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Actions sidebar */}
        <div className="space-y-5">

          {/* Room */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Room Allocation</h2>
            {profile.room ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                <Home size={16} className="text-blue-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Room {profile.room.roomNumber}</p>
                  {profile.room.block?.name && <p className="text-xs text-slate-500">{profile.room.block.name}</p>}
                  {profile.room.block?.address && <p className="text-xs text-slate-400">{profile.room.block.address}</p>}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Not yet assigned</p>
            )}
            {status !== "REJECTED" && (
              <AssignRoomActions tenantId={profile.id} currentRoomId={profile.roomId} availableRooms={availableRooms} />
            )}
          </div>

          {/* Approval */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</h2>
            <ApprovalActions userId={profile.userId} status={status} payments={profile.payments} />
          </div>

          {/* Partial payment toggle */}
          {["ACTIVE", "AWAITING_PAYMENT", "PAYMENT_MADE"].includes(status) && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Settings</h2>
              <PartialPaymentToggle
                tenantProfileId={profile.id}
                allowPartialPayment={profile.allowPartialPayment}
                partialPaymentInstallments={profile.partialPaymentInstallments}
                totalDue={profile.room?.rentAmount || null}
              />
            </div>
          )}

          {/* Expiry */}
          {profile.rentExpiryDate && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tenancy Expiry</h2>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                {new Date(profile.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{label}</span>
      <span className="text-sm font-semibold text-slate-800 sm:text-right">{value}</span>
    </div>
  );
}

function DocCard({ href, label, icon }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="group relative aspect-[4/3] rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 hover:border-blue-300 transition-all flex items-center justify-center">
      <img src={href} alt={label} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex flex-col justify-end p-3">
        <p className="text-white text-xs font-bold flex items-center gap-1.5">{icon} {label}</p>
      </div>
    </a>
  );
}
