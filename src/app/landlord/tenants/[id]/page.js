import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Phone, Mail, GraduationCap,
  Briefcase, FileText, ShieldCheck, Calendar, Home, Link2,
  CreditCard, CheckCircle2, Clock
} from "lucide-react";
import ApprovalActions from "../ApprovalActions";
import AssignRoomActions from "../AssignRoomActions";
import PartialPaymentToggle from "@/components/PartialPaymentToggle";
import StayHistorySection from "@/components/StayHistorySection";
import InteractivePaymentTable from "@/components/InteractivePaymentTable";

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
      room: { include: { block: true, billingRules: true } },
      stayHistory: {
        include: { room: { include: { block: true } } },
        orderBy: { startDate: "desc" },
        take: 50,
      },
      payments: { 
        orderBy: { createdAt: "desc" },
        include: {
          recurringCharge: {
            include: { billingRule: true }
          }
        }
      },
      primaryTenant: { include: { user: true } }
    },
  });

  if (!profile) notFound();

  const availableRooms = await prisma.room.findMany({
    where: { NOT: { status: "UNDER_MAINTENANCE" } },
    include: { tenants: true, block: true, billingRules: true },
    orderBy: { roomNumber: "asc" },
  });

  // Use only the billing rules directly ticked on the tenant's room.
  const billingRules = profile.room?.billingRules || [];

  // ── Installment Balance ──
  // Fetch all installment charges for this tenant to compute balance.
  // The targetTenantId is the primary tenant (sharers don't hold the ledger).
  const targetTenantId = profile.primaryTenantId || profile.id;
  const allInstallmentCharges = await prisma.recurringCharge.findMany({
    where: {
      tenantId: targetTenantId,
      billingRuleId: "__system_rent_installment__",
    },
    orderBy: { dueDate: "asc" },
  });

  // Partial payments made by this tenant (SUCCESS or VERIFIED)
  const partialPaymentsMade = profile.payments.filter(
    p => (p.status === "SUCCESS" || p.status === "VERIFIED") && p.isPartial
  );
  const paidInstallmentAmount = partialPaymentsMade.reduce((sum, p) => sum + p.amount, 0);

  // --- Path A: New system — installment RecurringCharge records exist ---
  const hasNewSystemCharges = allInstallmentCharges.length > 0;

  let remainingInstallmentCharges = [];
  let remainingBalance = 0;
  let totalPlanAmount = 0;
  let totalInstallmentCount = 0;
  let paidInstallments = 0;
  let nextInstallment = null;
  let hasActiveInstallmentPlan = false;

  if (hasNewSystemCharges) {
    remainingInstallmentCharges = allInstallmentCharges.filter(
      c => c.status === "UNPAID" || c.status === "OVERDUE" || c.status === "PENDING"
    );
    remainingBalance = remainingInstallmentCharges.reduce((sum, c) => sum + c.amount, 0);
    paidInstallments = allInstallmentCharges.filter(c => c.status === "PAID").length + 1; // +1 for first payment
    totalInstallmentCount = allInstallmentCharges.length + 1; // +1 for first
    totalPlanAmount = paidInstallmentAmount + remainingBalance;
    nextInstallment = remainingInstallmentCharges[0] || null;
    hasActiveInstallmentPlan = remainingInstallmentCharges.length > 0;

  // --- Path B: Legacy fallback — tenant has allowPartialPayment on profile ---
  } else if (profile.allowPartialPayment && profile.partialPaymentInstallments > 1 && partialPaymentsMade.length > 0) {
    totalInstallmentCount = profile.partialPaymentInstallments;
    paidInstallments = partialPaymentsMade.length;
    // Each installment amount = what they paid last time
    const installmentAmount = partialPaymentsMade[partialPaymentsMade.length - 1]?.amount || 0;
    const installmentsLeft = totalInstallmentCount - paidInstallments;
    remainingBalance = installmentsLeft * installmentAmount;
    totalPlanAmount = paidInstallmentAmount + remainingBalance;
    hasActiveInstallmentPlan = installmentsLeft > 0;
    // No concrete nextInstallment date — legacy tenants don't have scheduled charges
    nextInstallment = null;
  }


  const status = profile.primaryTenantId ? (profile.primaryTenant?.user?.status || "ACTIVE") : (profile.user?.status || "ACTIVE");
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
                {profile.primaryTenantId && (
                  <span 
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold border border-indigo-100"
                    title={`Linked to ${profile.primaryTenant?.user?.name || "Primary Tenant"}`}
                  >
                    <Link2 size={10} /> Sharer
                  </span>
                )}
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
          <StayHistorySection stayHistory={profile.stayHistory} />

          {/* Payment History */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Payment History</h2>
            </div>
            <div className="p-6">
              {!profile.payments?.length ? (
                <p className="text-xs text-slate-400 text-center py-4">No payments recorded.</p>
              ) : (
                <div className="space-y-4">
                  <InteractivePaymentTable 
                    payments={profile.payments.slice(0, 3)} 
                    allPayments={profile.payments}
                    billingRules={billingRules} 
                    showTime={false} 
                  />
                  {profile.payments.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 mt-2 text-center">
                      <Link href={`/landlord/tenants/${profile.id}/payment-history`} className="text-xs font-bold text-blue-600 hover:underline flex items-center justify-center gap-1">
                        View all Payment History
                      </Link>
                    </div>
                  )}
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
          {["ACTIVE", "AWAITING_PAYMENT", "PAYMENT_MADE", "EXPIRED"].includes(status) && (
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

          {/* Installment Balance Card */}
          {hasActiveInstallmentPlan && (
            <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5 space-y-4">
              <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                <CreditCard size={12} /> Installment Balance
              </h2>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                  <span className="text-[10px] font-bold text-blue-600">{paidInstallments} of {totalInstallmentCount} paid</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.round((paidInstallments / totalInstallmentCount) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Amounts */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Total Plan</span>
                  <span className="text-xs font-bold text-slate-800">₦{totalPlanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500" /> Paid</span>
                  <span className="text-xs font-bold text-green-600">₦{paidInstallmentAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                  <span className="text-xs font-bold text-slate-700">Remaining</span>
                  <span className="text-sm font-black text-blue-700">₦{remainingBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Next due — only available for new-system tenants with scheduled charges */}
              {nextInstallment ? (
                <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
                  <Clock size={12} className="text-blue-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Next Due</p>
                    <p className="text-xs font-bold text-blue-800">
                      {new Date(nextInstallment.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} — ₦{nextInstallment.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : hasActiveInstallmentPlan && (
                <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
                  <Clock size={12} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Next Due</p>
                    <p className="text-xs text-amber-700">Not scheduled — tenant must pay next installment manually.</p>
                  </div>
                </div>
              )}
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
