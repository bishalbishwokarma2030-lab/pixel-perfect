import { forwardRef } from "react";
import receiptTemplate from "@/assets/consignment-receipt-template-blank.jpg";
import { Consignment } from "@/lib/store";

export const ConsignmentReceipt = forwardRef<HTMLDivElement, { c: Consignment; width?: number }>(function ConsignmentReceipt({ c, width }, ref) {
  const isGuangzhou = (c.start_station || "").toLowerCase().includes("guangzhou");
  const isYiwu = (c.start_station || "").toLowerCase().includes("yiwu");
  const stationLabel = isGuangzhou ? "Guangzhou" : isYiwu ? "Yiwu" : c.start_station;
  const receivedBy = isGuangzhou ? "Ken Guangzhou" : isYiwu ? "Yiwu Su" : "";

  const totalAmountNum = Math.trunc(Number(c.grand_total || 0));
  const totalInWords = numberToWords(totalAmountNum);

  const text = {
    billNo: c.bill_no || "",
    startDate: c.start_date || "",
    marka: c.marka || "",
    phone: c.client_phone || "",
    description: c.description || "",
    packageType: c.package_type || "",
    quantity: String(c.quantity ?? ""),
    ctnNo: c.ctn_no || "",
    packagingFee: formatAmount(c.packaging_fee),
    loadingFee: formatAmount(c.loading_fee),
    unloadingFee: formatAmount(c.unloading_fee),
    cbm: formatAmount(c.cbm),
    weight: formatAmount(c.weight),
    tax: formatAmount(c.tax),
    freight: formatAmount(c.freight),
    localFreight: formatAmount(c.local_freight),
    valueOfGoods: formatAmount(c.value_of_goods),
    insurance: formatAmount(c.insurance),
    billCharge: formatAmount(c.bill_charge),
    advance: formatAmount(c.advance_amount),
    total: String(Math.trunc(Number(c.grand_total || 0)) || ""),
    totalWords: totalInWords,
    freightOnDelivery: formatAmount(c.payment_of_goods),
    tradeMode: c.trade_mode || "",
    remarks: c.remarks || "",
    destination: c.end_station || "",
    station: stationLabel || "",
    signature: receivedBy,
  };

  const NATIVE_W = 1578;
  const NATIVE_H = 997;
  const TARGET_W = width ?? 1200;
  const scale = TARGET_W / NATIVE_W;

  return (
    <div className="overflow-auto" ref={ref}>
      <div className="relative mx-auto font-sans text-black bg-white" style={{ width: `${TARGET_W}px`, height: `${NATIVE_H * scale}px` }}>
        <div className="absolute left-0 top-0 origin-top-left" style={{ width: `${NATIVE_W}px`, height: `${NATIVE_H}px`, transform: `scale(${scale})` }}>
          <img src={receiptTemplate} alt="Consignment receipt template" className="absolute inset-0 h-full w-full select-none" draggable={false} />

          <FillText className="left-[288px] top-[210px] w-[460px] text-[17px] font-semibold tracking-[0.2px]" value={text.billNo} />
          <FillText className="left-[284px] top-[290px] w-[464px] text-[17px] font-semibold" value={text.startDate} />
          <FillText className="left-[286px] top-[369px] w-[463px] text-[17px] font-semibold" value={text.marka} />

          <FillText className="left-[1062px] top-[210px] w-[493px] text-[24px] font-bold text-[#2ea24f]" value={text.station} />
          <FillText className="left-[1061px] top-[290px] w-[495px] text-[20px] font-bold text-[#e11d1d]" value={text.destination} />
          <FillText className="left-[1061px] top-[369px] w-[495px] text-[18px] font-semibold" value={text.phone} />

          <FillText className="left-[4px] top-[522px] w-[274px] text-[17px] font-semibold" value={text.description} />
          <FillText className="left-[278px] top-[522px] w-[101px] text-[17px] font-semibold" value={text.packageType} />
          <FillText className="left-[379px] top-[522px] w-[110px] text-[17px] font-semibold" value={text.quantity} />
          <FillText className="left-[489px] top-[522px] w-[107px] text-[17px] font-semibold" value={text.ctnNo} />
          <FillText className="left-[596px] top-[522px] w-[158px] text-[17px] font-semibold" value={text.packagingFee} />
          <FillText className="left-[754px] top-[522px] w-[87px] text-[17px] font-semibold" value={text.loadingFee} />
          <FillText className="left-[841px] top-[522px] w-[113px] text-[17px] font-semibold" value={text.unloadingFee} />
          <FillText className="left-[954px] top-[522px] w-[102px] text-[17px] font-semibold" value={text.cbm} />
          <FillText className="left-[1056px] top-[522px] w-[153px] text-[17px] font-semibold" value={text.weight} />
          <FillText className="left-[1209px] top-[522px] w-[112px] text-[17px] font-semibold" value={text.tax} />
          <FillText className="left-[1321px] top-[522px] w-[99px] text-[17px] font-semibold" value={text.freight} />
          <FillText className="left-[1420px] top-[522px] w-[157px] text-[17px] font-semibold" value={text.localFreight} />

          <FillText className="left-[0px] top-[608px] w-[277px] text-[17px] font-semibold" value={text.valueOfGoods} />
          <FillText className="left-[277px] top-[608px] w-[211px] text-[17px] font-semibold" value={text.insurance} />
          <FillText className="left-[488px] top-[608px] w-[264px] text-[17px] font-semibold" value={text.billCharge} />
          <FillText className="left-[752px] top-[608px] w-[303px] text-[17px] font-semibold" value={text.advance} />
          <FillText className="left-[1055px] top-[608px] w-[151px] text-[18px] font-bold text-[#e11d1d]" value={text.total} />
          <FillText className="left-[1206px] top-[608px] w-[215px] text-[17px] font-semibold" value={text.freightOnDelivery} />
          <FillText className="left-[1421px] top-[608px] w-[155px] text-[17px] font-bold text-[#e11d1d]" value={text.tradeMode} />

          {text.totalWords && (
            <div className="absolute left-[278px] top-[640px] flex h-[43px] w-[1298px] items-center justify-center px-6 text-center text-[18px] font-bold leading-none text-black">
              {text.totalWords}
            </div>
          )}

          <div className="absolute left-[278px] top-[684px] flex h-[53px] w-[777px] items-center justify-center px-4 text-center text-[15px] font-medium leading-tight text-black">
            {text.remarks}
          </div>

          <div className="absolute left-[1206px] top-[684px] flex h-[53px] w-[370px] items-center justify-center px-4 text-center text-[18px] font-bold leading-none text-black">
            {text.signature}
          </div>

          {text.station && (
            <div className="absolute left-[560px] top-[155px] w-[460px] text-[28px] font-extrabold text-[#2ea24f] text-center leading-none">
              {text.station}
            </div>
          )}

          <div className="absolute left-[1206px] top-[683px] h-[54px] w-[2px] bg-black" />
          <div className="absolute left-[1576px] top-[683px] h-[54px] w-[2px] bg-black" />
          <div className="absolute left-[1206px] top-[736px] h-[2px] w-[370px] bg-black" />

          {/* English translation overlay — masks Chinese labels with white blocks and prints English equivalents */}
          <EnLabel className="left-[180px] top-[195px] w-[110px] h-[40px]" text="Bill No." />
          <EnLabel className="left-[180px] top-[275px] w-[110px] h-[40px]" text="Date" />
          <EnLabel className="left-[180px] top-[354px] w-[110px] h-[40px]" text="Brand" />
          <EnLabel className="left-[955px] top-[195px] w-[110px] h-[40px]" text="From" />
          <EnLabel className="left-[955px] top-[275px] w-[110px] h-[40px]" text="To" />
          <EnLabel className="left-[955px] top-[354px] w-[110px] h-[40px]" text="Phone" />

          {/* Column headers row above first data row (y≈480) */}
          <EnHeader className="left-[4px] top-[483px] w-[274px]" text="Description" />
          <EnHeader className="left-[278px] top-[483px] w-[101px]" text="Pkg Type" />
          <EnHeader className="left-[379px] top-[483px] w-[110px]" text="Qty" />
          <EnHeader className="left-[489px] top-[483px] w-[107px]" text="CTN No." />
          <EnHeader className="left-[596px] top-[483px] w-[158px]" text="Packaging" />
          <EnHeader className="left-[754px] top-[483px] w-[87px]" text="Loading" />
          <EnHeader className="left-[841px] top-[483px] w-[113px]" text="Unloading" />
          <EnHeader className="left-[954px] top-[483px] w-[102px]" text="CBM" />
          <EnHeader className="left-[1056px] top-[483px] w-[153px]" text="Weight" />
          <EnHeader className="left-[1209px] top-[483px] w-[112px]" text="Tax" />
          <EnHeader className="left-[1321px] top-[483px] w-[99px]" text="Freight" />
          <EnHeader className="left-[1420px] top-[483px] w-[157px]" text="Local Freight" />

          {/* Headers above second data row (y≈569) */}
          <EnHeader className="left-[0px] top-[569px] w-[277px]" text="Value of Goods" />
          <EnHeader className="left-[277px] top-[569px] w-[211px]" text="Insurance" />
          <EnHeader className="left-[488px] top-[569px] w-[264px]" text="Bill Charge" />
          <EnHeader className="left-[752px] top-[569px] w-[303px]" text="Advance" />
          <EnHeader className="left-[1055px] top-[569px] w-[151px]" text="Total" />
          <EnHeader className="left-[1206px] top-[569px] w-[215px]" text="Freight on Delivery" />
          <EnHeader className="left-[1421px] top-[569px] w-[155px]" text="Trade Mode" />

          {/* Footer labels (remarks / signature) row header at y≈660 */}
          <EnHeader className="left-[278px] top-[665px] w-[777px]" text="Remarks" />
          <EnHeader className="left-[1206px] top-[665px] w-[370px]" text="Received By" />
        </div>
      </div>
    </div>
  );
});

function EnLabel({ className, text }: { className: string; text: string }) {
  return (
    <div className={`absolute flex items-center justify-center bg-white text-[14px] font-semibold text-black border border-black/10 ${className}`}>
      {text}
    </div>
  );
}

function EnHeader({ className, text }: { className: string; text: string }) {
  return (
    <div className={`absolute flex h-[18px] items-center justify-center bg-white text-[12px] font-bold uppercase tracking-wide text-[#2ea24f] ${className}`}>
      {text}
    </div>
  );
}

function FillText({ className, value }: { className: string; value: string }) {
  if (!value) return null;
  return <div className={`absolute text-center leading-none ${className}`}>{value}</div>;
}

function formatAmount(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return String(value);
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(2);
}

function numberToWords(num: number): string {
  if (!isFinite(num) || num === 0) return "";
  const negative = num < 0;
  const n = Math.abs(num);
  const whole = Math.floor(n);

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function under1000(x: number): string {
    let s = "";
    if (x >= 100) {
      s += ones[Math.floor(x / 100)] + " Hundred";
      x %= 100;
      if (x) s += " ";
    }
    if (x >= 20) {
      s += tens[Math.floor(x / 10)];
      if (x % 10) s += "-" + ones[x % 10];
    } else if (x > 0) {
      s += ones[x];
    }
    return s;
  }

  function toWords(x: number): string {
    if (x === 0) return "Zero";
    const units = ["", "Thousand", "Million", "Billion"];
    let i = 0;
    let result = "";
    while (x > 0) {
      const chunk = x % 1000;
      if (chunk) {
        result = under1000(chunk) + (units[i] ? " " + units[i] : "") + (result ? " " + result : "");
      }
      x = Math.floor(x / 1000);
      i++;
    }
    return result;
  }

  let words = toWords(whole);
  words += " Only";
  return (negative ? "Negative " : "") + words;
}