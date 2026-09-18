import React, { forwardRef } from 'react';

const PrintableBill = forwardRef(({ invoice }, ref) => {
  if (!invoice) return null;

  const {
    invoiceNo = 'ASM/26-27/001',
    date = new Date(),
    term = '30 Days',
    placeOfSupply = 'Tamil Nadu (33)',
    sellerDetails = {},
    buyerDetails = {},
    items = [],
    totalQty = 0,
    totalBeforeTax = 0,
    isInterState = false,
    cgstRate = 2.5,
    cgstAmount = 0,
    sgstRate = 2.5,
    sgstAmount = 0,
    igstRate = 5.0,
    igstAmount = 0,
    totalGst = 0,
    roundOff = 0,
    netTotal = 0,
    amountInWords = '',
    bankDetails = {},
    terms = [],
  } = invoice;

  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div ref={ref} className="invoice-print-container">
      <div className="print-border-box">
        {/* ================= SELLER & INVOICE HEADER ================= */}
        <div className="print-header">
          <div className="print-title">TAX INVOICE / GST INVOICE</div>
          <div className="print-company-name">{sellerDetails.name || 'AS MARKETING'}</div>
          <div className="print-company-sub">
            {sellerDetails.tagline || 'WHOLESALE FOOTWEAR DISTRIBUTOR'}
          </div>
          <div className="print-company-address">
            {sellerDetails.address || 'No. 14/B, Old Bus Stand Road, Thanjavur, Tamil Nadu - 613001'}
          </div>
          <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: '600' }}>
            <span>{sellerDetails.contact || 'Ph: +91 98424 55123, +91 94431 88290'}</span>
            <span style={{ margin: '0 8px' }}>|</span>
            <span>GSTIN: <strong>{sellerDetails.gstin || '33APDPM1586P1ZG'}</strong></span>
            <span style={{ margin: '0 8px' }}>|</span>
            <span>State: Tamil Nadu (33)</span>
          </div>
        </div>

        {/* ================= BUYER & INVOICE DETAILS GRID ================= */}
        <div className="print-two-col">
          {/* Left Column: Buyer (Bill To) */}
          <div className="print-col-left">
            <div style={{ fontWeight: '800', fontSize: '11px', textDecoration: 'underline', marginBottom: '4px' }}>
              BUYER DETAILS (BILL TO):
            </div>
            <table className="print-meta-table">
              <tbody>
                <tr>
                  <td className="label">M/s. (Buyer Name):</td>
                  <td style={{ fontWeight: '700', fontSize: '11px' }}>{buyerDetails.name || '-'}</td>
                </tr>
                <tr>
                  <td className="label">Address:</td>
                  <td>{buyerDetails.address || '-'}</td>
                </tr>
                <tr>
                  <td className="label">Contact / Phone:</td>
                  <td>{buyerDetails.contact || '-'}</td>
                </tr>
                <tr>
                  <td className="label">Buyer GSTIN:</td>
                  <td style={{ fontWeight: '700' }}>{buyerDetails.gstin || 'URP (Unregistered)'}</td>
                </tr>
                <tr>
                  <td className="label">State & Code:</td>
                  <td>{buyerDetails.state || 'Tamil Nadu'} ({buyerDetails.stateCode || '33'})</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right Column: Invoice Meta */}
          <div className="print-col-right">
            <div style={{ fontWeight: '800', fontSize: '11px', textDecoration: 'underline', marginBottom: '4px' }}>
              INVOICE SPECIFICATIONS:
            </div>
            <table className="print-meta-table">
              <tbody>
                <tr>
                  <td className="label">Invoice No:</td>
                  <td style={{ fontWeight: '800', fontSize: '11px' }}>{invoiceNo}</td>
                </tr>
                <tr>
                  <td className="label">Invoice Date:</td>
                  <td style={{ fontWeight: '700' }}>{formattedDate}</td>
                </tr>
                <tr>
                  <td className="label">Payment Term:</td>
                  <td>{term || '30 Days'}</td>
                </tr>
                <tr>
                  <td className="label">Place of Supply:</td>
                  <td>{placeOfSupply || 'Tamil Nadu (33)'}</td>
                </tr>
                <tr>
                  <td className="label">Reverse Charge:</td>
                  <td>NO</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= ITEMIZED GOODS TABLE ================= */}
        <table className="print-item-table">
          <thead>
            <tr>
              <th style={{ width: '26px' }}>S.N</th>
              <th style={{ textAlign: 'left', paddingLeft: '8px' }}>DESCRIPTION OF GOODS (FOOTWEAR MODEL)</th>
              <th style={{ width: '60px', textAlign: 'center' }}>COLOR</th>
              <th style={{ width: '40px', textAlign: 'center' }}>SIZE</th>
              <th style={{ width: '42px', textAlign: 'center' }}>HSN</th>
              <th style={{ width: '42px', textAlign: 'center' }}>QTY (PRS)</th>
              <th style={{ width: '50px', textAlign: 'right' }}>MRP</th>
              <th style={{ width: '50px', textAlign: 'right' }}>RATE</th>
              <th style={{ width: '38px', textAlign: 'right' }}>DIS%</th>
              <th style={{ width: '52px', textAlign: 'right' }}>DISCOUNT</th>
              <th style={{ width: '72px', textAlign: 'right', paddingRight: '6px' }}>AMOUNT (Rs)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'center' }}>{it.sn || idx + 1}</td>
                <td style={{ fontWeight: '600', paddingLeft: '8px' }}>{it.modelName || it.description}</td>
                <td style={{ textAlign: 'center', fontWeight: '700', fontSize: '10px' }}>
                  {(it.color || 'BLACK').toUpperCase()}
                </td>
                <td style={{ textAlign: 'center', fontWeight: '700' }}>{it.size || '-'}</td>
                <td style={{ textAlign: 'center' }}>{it.hsn || '6402'}</td>
                <td style={{ textAlign: 'center', fontWeight: '700' }}>{it.qty}</td>
                <td style={{ textAlign: 'right' }}>{Number(it.mrp).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>{Number(it.rate).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>{it.disPercent ? `${it.disPercent}%` : '-'}</td>
                <td style={{ textAlign: 'right' }}>{Number(it.disAmount || 0).toFixed(2)}</td>
                <td style={{ textAlign: 'right', fontWeight: '700', paddingRight: '6px' }}>
                  {Number(it.amount).toFixed(2)}
                </td>
              </tr>
            ))}

            {/* Empty filler rows to maintain standard invoice height on paper */}
            {items.length < 8 &&
              Array.from({ length: 8 - items.length }).map((_, i) => (
                <tr key={`filler-${i}`} style={{ height: '22px' }}>
                  <td style={{ textAlign: 'center', color: 'transparent' }}>.</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))}

            {/* Total Row */}
            <tr className="total-row">
              <td colSpan="5" style={{ textAlign: 'right', paddingRight: '8px' }}>
                TOTAL QUANTITY:
              </td>
              <td style={{ textAlign: 'center', fontSize: '11px' }}>{totalQty} Pairs</td>
              <td colSpan="4" style={{ textAlign: 'right', paddingRight: '8px' }}>
                TOTAL AMOUNT BEFORE TAX:
              </td>
              <td style={{ textAlign: 'right', paddingRight: '6px', fontSize: '11px' }}>
                {Number(totalBeforeTax).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ================= TAX & TOTALS SECTION ================= */}
        <div className="print-bottom-split">
          {/* Left: Amount in words */}
          <div className="print-bottom-left">
            <div>
              <div style={{ fontWeight: '700', fontSize: '10px', textDecoration: 'underline', marginBottom: '3px' }}>
                AMOUNT IN WORDS (INR):
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', fontStyle: 'italic', textTransform: 'capitalize' }}>
                {amountInWords || 'Rupees Zero Only'}
              </div>
            </div>
            <div style={{ fontSize: '9px', color: '#444444', marginTop: '10px' }}>
              Certified that all particulars given above are true and correct.
            </div>
          </div>

          {/* Right: Tax Breakdown */}
          <div className="print-bottom-right">
            <table className="print-calc-table">
              <tbody>
                <tr>
                  <td>Total Amount Before Tax:</td>
                  <td className="amount-col">{Number(totalBeforeTax).toFixed(2)}</td>
                </tr>

                {isInterState ? (
                  <tr>
                    <td>Add IGST @ {igstRate || 5}%:</td>
                    <td className="amount-col">{Number(igstAmount).toFixed(2)}</td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td>Add CGST @ {cgstRate || 2.5}%:</td>
                      <td className="amount-col">{Number(cgstAmount).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Add SGST @ {sgstRate || 2.5}%:</td>
                      <td className="amount-col">{Number(sgstAmount).toFixed(2)}</td>
                    </tr>
                  </>
                )}

                <tr>
                  <td style={{ fontWeight: '700' }}>Total GST Amount:</td>
                  <td className="amount-col" style={{ fontWeight: '700' }}>
                    {Number(totalGst).toFixed(2)}
                  </td>
                </tr>

                <tr>
                  <td>Round Off:</td>
                  <td className="amount-col">
                    {roundOff > 0 ? `+${Number(roundOff).toFixed(2)}` : Number(roundOff).toFixed(2)}
                  </td>
                </tr>

                <tr className="net-total-row">
                  <td>NET PAYABLE TOTAL:</td>
                  <td className="amount-col" style={{ fontSize: '13px' }}>
                    Rs. {Number(netTotal).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= FOOTER: BANK DETAILS, TERMS & SIGNATURE ================= */}
        <div className="print-footer-split">
          {/* Left: Bank details & Terms */}
          <div className="print-footer-left">
            <div className="bank-info-box">
              <div style={{ fontWeight: '800', textDecoration: 'underline', marginBottom: '2px' }}>
                BANK DETAILS FOR PAYMENT:
              </div>
              <div>Account Name: <strong>{bankDetails.accountName || 'JAS MARKETING'}</strong></div>
              <div>Bank Name: <strong>{bankDetails.bankName || 'SOUTH INDIAN BANK'}</strong></div>
              <div>A/C Number: <strong>{bankDetails.accountNo || '0076073000010634'}</strong></div>
              <div>IFSC Code: <strong>{bankDetails.ifsc || 'SIBL0000076'}</strong> | Branch: {bankDetails.branch || 'Thanjavur'}</div>
            </div>

            <div className="terms-box">
              <div style={{ fontWeight: '700', textDecoration: 'underline' }}>TERMS & CONDITIONS:</div>
              {terms && terms.length > 0 ? (
                terms.map((t, idx) => (
                  <div key={idx}>
                    {idx + 1}. {t}
                  </div>
                ))
              ) : (
                <>
                  <div>1. Goods once sold will not be taken back or exchanged after 15 days.</div>
                  <div>2. Interest @ 18% p.a. will be charged on overdue bills beyond due date.</div>
                  <div>3. Subject to Thanjavur Jurisdiction only.</div>
                </>
              )}
            </div>
          </div>

          {/* Right: Signatory */}
          <div className="print-footer-right">
            <div style={{ fontSize: '11px', fontWeight: '700' }}>
              For <strong>{sellerDetails.name || 'AS MARKETING'}</strong>
            </div>
            <div style={{ margin: '30px 0 0 0' }}>
              <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto 4px auto' }}></div>
              <div className="signatory-box">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PrintableBill;
