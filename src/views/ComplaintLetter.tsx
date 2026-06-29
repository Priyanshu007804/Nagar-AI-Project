import React, { useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Download, FileText, Loader2, AlertCircle } from "lucide-react";
import { WARDS, ISSUE_TYPES } from "../lib/data";
import { generateComplaintLetter } from "../lib/gemini";
import { motion, AnimatePresence } from "motion/react";

export function ComplaintLetterPage() {
  const slideUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const [citizenName, setCitizenName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [ward, setWard] = useState("");
  const [issueType, setIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [location, setLocation] = useState("");

  const [letterContent, setLetterContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const letterRef = useRef<HTMLDivElement>(null);

  const handleGenerateLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenName || !city || !phone || !issueDescription || !ward) return;

    setIsGenerating(true);
    setError(null);
    setLetterContent("");

    try {
      const issueDetails = `${issueType}${location ? ` at ${location}` : ""}. Details: ${issueDescription}`;
      const letter = await generateComplaintLetter(citizenName, ward, issueDetails, city, phone, email);
      setLetterContent(letter);
    } catch (err) {
      console.error("Failed to generate letter:", err);
      setError("Failed to generate letter. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadText = () => {
    if (!letterContent) return;
    const element = document.createElement("a");
    const file = new Blob([letterContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `complaint-letter-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    if (!letterContent) return;
    
    // Create a temporary hidden iframe for clean printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Municipal Complaint Letter - NagarAI</title>
            <style>
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                font-family: "Georgia", "Times New Roman", Times, serif;
                font-size: 14px;
                line-height: 1.6;
                color: #111111;
                background-color: #ffffff;
                margin: 0;
                padding: 10px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              pre {
                white-space: pre-wrap;
                word-wrap: break-word;
                font-family: "Georgia", "Times New Roman", Times, serif;
                font-size: 14px;
                line-height: 1.6;
                margin: 0;
              }
            </style>
          </head>
          <body>
            <pre>${letterContent}</pre>
          </body>
        </html>
      `);
      doc.close();
      
      // Delay printing slightly to ensure the document parses and renders fully
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
      }, 350);
    } else {
      // Fallback if iframe access fails
      window.print();
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-foreground">Generate Complaint Letter</h1>
          <p className="text-muted-foreground">
            Create an official complaint letter for municipal authorities with automatic formatting.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Form Panel */}
          <motion.div initial="hidden" animate="visible" variants={slideUpVariants}>
            <Card className="border-border/40 bg-card/50 p-8 backdrop-blur-md shadow-lg">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Complaint Details
              </h2>

              <form onSubmit={handleGenerateLetter} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Citizen Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    id="input-citizen-name"
                    placeholder="Enter your full name"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    required
                    disabled={isGenerating}
                    className="mt-2 bg-background/50 text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      City <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="text"
                      id="input-city"
                      placeholder="e.g. New Delhi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      disabled={isGenerating}
                      className="mt-2 bg-background/50 text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="tel"
                      id="input-phone"
                      placeholder="e.g. +91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={isGenerating}
                      className="mt-2 bg-background/50 text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Email Address <span className="text-muted-foreground">(Optional)</span>
                  </label>
                  <Input
                    type="email"
                    id="input-email"
                    placeholder="yourname@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isGenerating}
                    className="mt-2 bg-background/50 text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Ward Number / Area <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    required
                    disabled={isGenerating}
                    className="mt-2 w-full rounded-lg border border-border/40 bg-background/50 px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                  >
                    <option value="" disabled className="bg-card text-muted-foreground">
                      Select ward number
                    </option>
                    {WARDS.map((w) => (
                      <option key={w} value={w} className="bg-card text-foreground">
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Issue Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    required
                    disabled={isGenerating}
                    className="mt-2 w-full rounded-lg border border-border/40 bg-background/50 px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                  >
                    <option value="" disabled className="bg-card text-muted-foreground">
                      Select issue type
                    </option>
                    {ISSUE_TYPES.map((type) => (
                      <option key={type} value={type} className="bg-card text-foreground">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Location <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter street, landmark, or area name"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    disabled={isGenerating}
                    className="mt-2 bg-background/50 text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Issue Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    placeholder="Describe the civic issue in detail. Include severity, how long it has persisted, and any supporting details."
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    required
                    disabled={isGenerating}
                    className="mt-2 h-40 w-full rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full cursor-pointer font-semibold" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    "Generate Letter"
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Letter Preview Panel */}
          <AnimatePresence mode="wait">
            {(letterContent || isGenerating) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-border/40 bg-card/50 p-8 max-h-[800px] overflow-y-auto backdrop-blur-md shadow-lg">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">Letter Preview</h2>
                    {letterContent && !isGenerating && (
                      <Badge className="bg-green-900/30 text-green-400">Ready</Badge>
                    )}
                    {isGenerating && (
                      <Badge className="bg-yellow-900/30 text-yellow-400 animate-pulse">Generating...</Badge>
                    )}
                  </div>

                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Gemini AI is drafting your complaint letter...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        ref={letterRef}
                        id="letter-preview"
                        className="prose prose-invert max-w-none mb-6 rounded-lg bg-white p-8 font-serif text-sm leading-relaxed text-gray-900 shadow-sm print:shadow-none print:p-0 select-text"
                      >
                        <pre className="whitespace-pre-wrap break-words font-serif text-sm text-gray-900 leading-relaxed font-normal">
                          {letterContent}
                        </pre>
                      </div>

                      <div className="space-y-3 border-t border-border/40 pt-6">
                        <Button
                          onClick={handlePrint}
                          size="sm"
                          className="w-full flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                          Download as PDF / Print
                        </Button>
                        <Button
                          onClick={handleDownloadText}
                          size="sm"
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <FileText className="h-4 w-4" />
                          Download as Text File
                        </Button>
                      </div>
                    </>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Section */}
        <AnimatePresence mode="wait">
          {!letterContent && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="mt-8 border-border/40 border-l-4 border-l-primary bg-card/50 backdrop-blur-md shadow-lg p-6">
                <h3 className="mb-4 font-semibold text-foreground">About This Letter</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• AI-powered letter generation using Google Gemini</li>
                  <li>• Generates a professional, properly formatted formal complaint letter</li>
                  <li>• Pre-formatted for municipal corporation submission in India</li>
                  <li>• Can be downloaded as Text, printed directly, or saved as PDF</li>
                  <li>• Helps ensure your civic grievances receive formal official attention</li>
                </ul>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Print-only CSS injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #letter-preview, #letter-preview * {
              visibility: visible !important;
            }
            #letter-preview {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              padding: 40px !important;
              font-size: 14px !important;
              box-shadow: none !important;
              border: none !important;
            }
          }
        `
      }} />
    </main>
  );
}
