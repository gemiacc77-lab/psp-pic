if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const SESSION_KEY = "optiline_psp_session";
const SESSION_TIMEOUT = 30 * 60 * 1000;

function initSession() {
  const session = localStorage.getItem(SESSION_KEY);
  if (session) {
    const parsed = JSON.parse(session);
    if (Date.now() - parsed.lastActivity < SESSION_TIMEOUT) {
      document.documentElement.classList.add('is-logged-in');
      const loginStage = document.getElementById("loginStage");
      const dashStage = document.getElementById("dashStage");
      if (loginStage && dashStage) {
        loginStage.classList.remove("active");
        dashStage.classList.remove("hidden");
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } else {
      localStorage.removeItem(SESSION_KEY);
      document.documentElement.classList.remove('is-logged-in');
    }
  } else {
    document.documentElement.classList.remove('is-logged-in');
  }
}
initSession();

let activityTimeout = null;
function updateActivity() {
  if (activityTimeout) return;
  activityTimeout = setTimeout(() => {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      parsed.lastActivity = Date.now();
      localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
    }
    activityTimeout = null;
  }, 5000);
}

['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(evt => {
  document.addEventListener(evt, updateActivity, { passive: true });
});

setInterval(() => {
  const sessionData = localStorage.getItem(SESSION_KEY);
  if(sessionData) {
    const parsed = JSON.parse(sessionData);
    if (Date.now() - parsed.lastActivity >= SESSION_TIMEOUT) {
      localStorage.removeItem(SESSION_KEY);
      window.location.reload();
    }
  }
}, 60000);

document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://script.google.com/macros/s/AKfycbxqX2Zjv13GkMIR3BrPnt0Pe3JPuz6y1aJ6aS5uifruzfrmhan6KAEUl-lW2D6Q7vd-/exec";
  const ENROLL_WEBHOOK = "https://script.google.com/macros/s/AKfycbyck7pBRCWeseen7SkV4ntkgjRmZ4IepOOwWXq75pk3WbJQnFrVVTV-6FmBoyullnT4/exec";
  
  const els = {
    loginStage: document.getElementById("loginStage"),
    dashStage: document.getElementById("dashStage"),
    pid: document.getElementById("pid"),
    ppass: document.getElementById("ppass"),
    authBtn: document.getElementById("authBtn"),
    authError: document.getElementById("authError"),
    pName: document.getElementById("pName"),
    refLink: document.getElementById("refLink"),
    valComm: document.getElementById("valComm"),
    valSales: document.getElementById("valSales"),
    tableBody: document.getElementById("tableBody"),
    emptyState: document.getElementById("emptyState"),
    withdrawRequestBtn: document.getElementById("withdrawRequestBtn"),
    copyBtn: document.getElementById("copyBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    enrollForm: document.getElementById("enrollForm"),
    enrollSubmit: document.getElementById("enrollSubmit"),
    tipText: document.getElementById("tipText"),
    milestoneCards: document.querySelectorAll(".milestone-card"),
    prevTip: document.getElementById("prevTip"),
    nextTip: document.getElementById("nextTip"),
    exportCSV: document.getElementById("exportCSV"),
    exportExcel: document.getElementById("exportExcel"),
    exportPDF: document.getElementById("exportPDF"),
    txFilter: document.getElementById("txFilter"),
    transactionTable: document.getElementById("transactionTable"),
    generateLinkBtn: document.getElementById("generateLinkBtn"),
    copySmartLinkBtn: document.getElementById("copySmartLinkBtn"),
    smartLinkOutput: document.getElementById("smartLinkOutput"),
    resultContainer: document.getElementById("resultContainer"),
    feedTrack: document.getElementById("feedTrack"),
    withdrawalTableBody: document.getElementById("withdrawalTableBody"),
  };

  const tips = [
    "Consistency is key: Share your link daily to build momentum.",
    "Your potential is limitless keep pushing boundaries.",
    "Every click is a step closer to your next milestone.",
    "Success is not an accident, it's a choice you make every day.",
    "Focus on value: Explain how OPTILINE solves real problems.",
    "Be the leader in your network. Show them the future.",
    "Small daily improvements lead to stunning results.",
    "Track your metrics, optimize your strategy, scale your income.",
    "You are part of the elite. Act like it.",
    "Momentum builds success. Keep the wheel turning.",
    "Your network is your net worth. Expand it.",
    "Legendary status is just a few conversions away.",
  ];
  
  let charts = { package: null, trend: null };
  let currentTipIndex = 0;
  let currentTransactions = [];
  let currentWithdrawals = [];

  const activeSession = localStorage.getItem(SESSION_KEY);
  if (activeSession && document.documentElement.classList.contains('is-logged-in')) {
    const parsedData = JSON.parse(activeSession);
    setTimeout(() => {
      loadDashboard(parsedData.data, true);
    }, 50);
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "partner_login",
        partnerId: parsedData.data.partnerId,
        password: parsedData.data.password
      }),
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        data.data.password = parsedData.data.password;
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          data: data.data,
          lastActivity: Date.now()
        }));
        loadDashboard(data.data, true);
      }
    });
  } else {
    document.documentElement.classList.remove('is-logged-in');
    if (typeof gsap !== "undefined") {
      gsap.to(".login-card", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 });
    } else {
      const card = document.querySelector(".login-card");
      if(card) { card.style.opacity = "1"; card.style.transform = "none"; }
    }
  }

  function initializeTipSystem() {
    if (els.tipText && els.prevTip && els.nextTip) {
      updateTipProgress();
      els.prevTip.addEventListener("click", () => {
        currentTipIndex = (currentTipIndex - 1 + tips.length) % tips.length;
        updateTipDisplay();
        updateTipProgress();
      });
      els.nextTip.addEventListener("click", () => {
        currentTipIndex = (currentTipIndex + 1) % tips.length;
        updateTipDisplay();
        updateTipProgress();
      });
      updateTipDisplay();
      setInterval(() => {
        currentTipIndex = (currentTipIndex + 1) % tips.length;
        updateTipDisplay();
        updateTipProgress();
      }, 8000);
    }
  }

  function updateTipDisplay() {
    if (!els.tipText) return;
    if (typeof gsap !== "undefined") {
      gsap.to(els.tipText, {
        opacity: 0, y: 20, duration: 0.3,
        onComplete: () => {
          els.tipText.textContent = tips[currentTipIndex];
          gsap.to(els.tipText, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
        },
      });
    } else {
        els.tipText.textContent = tips[currentTipIndex];
    }
  }

  function updateTipProgress() {
    const progressBar = document.querySelector(".tip-progress-bar");
    if (progressBar) {
      const progress = ((currentTipIndex + 1) / tips.length) * 100;
      if (typeof gsap !== "undefined") {
        gsap.to(progressBar, { width: `${progress}%`, duration: 0.5, ease: "power2.out" });
      } else {
        progressBar.style.width = `${progress}%`;
      }
    }
  }

  if (els.authBtn) els.authBtn.addEventListener("click", attemptLogin);
  if (document.getElementById("togglePassword")) {
    document.getElementById("togglePassword").addEventListener("click", function () {
        const isPass = els.ppass.getAttribute("type") === "password";
        els.ppass.setAttribute("type", isPass ? "text" : "password");
        this.classList.remove(isPass ? "fa-eye-slash" : "fa-eye");
        this.classList.add(isPass ? "fa-eye" : "fa-eye-slash");
        this.style.color = isPass ? "var(--accent-light)" : "var(--text-gray)";
      });
  }

  if (els.logoutBtn) {
    els.logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(SESSION_KEY);
      window.location.reload();
    });
  }

  [els.pid, els.ppass].forEach((input) => {
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") attemptLogin();
      });
    }
  });

  if (els.withdrawRequestBtn) {
    els.withdrawRequestBtn.addEventListener("click", () => {
      const sessionData = localStorage.getItem(SESSION_KEY);
      let partnerId = "";
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed && parsed.data && parsed.data.partnerId) {
          partnerId = parsed.data.partnerId;
        }
      }
      window.location.href = `/withdraw/?pid=${partnerId}`;
    });
  }

  if (els.copyBtn) {
    els.copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(els.refLink.textContent).then(() => {
        const originalText = els.copyBtn.textContent;
        const originalBackground = els.copyBtn.style.background;
        els.copyBtn.textContent = "Copied!";
        els.copyBtn.style.background = "#10B981";
        els.copyBtn.style.color = "white";
        setTimeout(() => {
          els.copyBtn.textContent = originalText;
          els.copyBtn.style.background = originalBackground;
          els.copyBtn.style.color = "";
        }, 2000);
      });
    });
  }

  if (els.enrollForm) {
    els.enrollForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const feedbackEl = document.getElementById("formFeedback");
      const submitBtn = els.enrollSubmit;
      const phoneInput = els.enrollForm.querySelector('input[name="phone"]');
      const emailInput = els.enrollForm.querySelector('input[name="email"]');
      const originalBtnText = submitBtn.innerHTML;
      function showLocalError(msg) {
        if (feedbackEl) {
          feedbackEl.textContent = msg;
          feedbackEl.style.display = "block";
          feedbackEl.className = "form-feedback error-msg";
          if (typeof gsap !== "undefined") {
            gsap.fromTo(feedbackEl, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
          }
        } else { alert(msg); }
      }
      if (!phoneInput.value.startsWith("+")) {
        showLocalError("Phone number must start with country code (e.g. +966...).");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
        showLocalError("Please enter a valid email address.");
        return;
      }
      const socialInput = els.enrollForm.querySelector('input[name="social"]');
      if (!socialInput || !socialInput.value.trim() || !/^https?:\/\/.+/i.test(socialInput.value.trim())) {
        showLocalError("Please enter a valid URL starting with http:// or https://");
        return;
      }
      const formData = new FormData(els.enrollForm);
      const turnstileToken = formData.get("cf-turnstile-response");
      if (!turnstileToken) {
        showLocalError("Please complete the security check (Captcha) above the button.");
        return;
      }
      if (feedbackEl) feedbackEl.style.display = "none";
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';
      const data = new URLSearchParams();
      for (const pair of formData) { data.append(pair[0], pair[1]); }
      if (!data.has("cf-turnstile-response")) { data.append("cf-turnstile-response", turnstileToken); }
      try {
        const response = await fetch(ENROLL_WEBHOOK, { method: "POST", body: data });
        const result = await response.json();
        if (result.status === "success" || result.result === "success") {
          if (typeof turnstile !== "undefined") turnstile.reset();
          localStorage.removeItem("partnerName");
          localStorage.removeItem("partnerPhone");
          localStorage.removeItem("partnerEmail");
          localStorage.removeItem("partnerSocial");
          localStorage.removeItem("partnerMessage");
          handleSuccess(result.name || "Partner");
        } else {
          throw new Error(result.message || "Submission failed");
        }
      } catch (err) {
        showLocalError(err.message === "Failed to fetch" ? "Connection error. Please check your internet." : err.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        if (typeof turnstile !== "undefined") turnstile.reset();
      }
    });
    
    function handleSuccess(name) {
      const formEl = document.getElementById("enrollForm");
      const successEl = document.getElementById("enrollSuccess");
      const successNameEl = document.getElementById("successName");
      if (typeof gsap !== "undefined") {
        gsap.to(formEl, {
          opacity: 0, height: 0, margin: 0, padding: 0, duration: 0.5,
          onComplete: () => {
            formEl.style.display = "none";
            successEl.style.display = "block";
            if (successNameEl) successNameEl.textContent = name;
            gsap.fromTo(successEl, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });
          },
        });
      } else {
        formEl.style.display = "none";
        successEl.style.display = "block";
        if (successNameEl) successNameEl.textContent = name;
      }
    }
  }

  function setupExportButtons() {
    if (els.exportCSV) els.exportCSV.addEventListener("click", exportToCSV);
    if (els.exportExcel) els.exportExcel.addEventListener("click", exportToExcel);
    if (els.exportPDF) els.exportPDF.addEventListener("click", exportToPDF);
    if (els.txFilter) {
      els.txFilter.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "all") {
          renderTable(currentTransactions);
        } else {
          const limit = parseInt(val);
          const now = new Date();
          const filtered = currentTransactions.filter((tx) => {
            if (!tx.date) return false;
            const txDate = new Date(tx.date);
            const diffTime = Math.abs(now - txDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= limit;
          });
          renderTable(filtered);
        }
      });
    }
  }

  function exportToCSV() {
    if (currentTransactions.length === 0) {
      alert("No transaction data to export.");
      return;
    }
    let csvContent = "Date,Package,Ref ID,Commission,Status\n";
    currentTransactions.forEach((tx) => {
      const row = [
        tx.date || "N/A", tx.package || "N/A", tx.ref || "-", `$${tx.commission || "0"}`, tx.status || "Completed",
      ];
      csvContent += row.map((field) => `"${field}"`).join(",") + "\n";
    });
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `optiline-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function exportToExcel() {
    if (currentTransactions.length === 0) {
      alert("No transaction data to export.");
      return;
    }
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Date", "Package", "Ref ID", "Commission", "Status"],
      ...currentTransactions.map((tx) => [
        tx.date || "N/A", tx.package || "N/A", tx.ref || "-", parseFloat(tx.commission) || 0, tx.status || "Completed",
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `optiline-transactions-${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  function exportToPDF() {
    if (currentTransactions.length === 0 && currentWithdrawals.length === 0) {
      alert("No data available to export.");
      return;
    }
    const getLogoData = () => {
      const img = document.querySelector(".logo img");
      if (!img) return null;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL("image/png");
    };
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const partnerName = els.pName ? els.pName.textContent : "Partner";
    const logoData = getLogoData();
    const dateStr = new Date().toLocaleDateString();
    
    doc.setFillColor(18, 8, 47);
    doc.rect(0, 0, 210, 40, "F");
    if (logoData) {
      doc.addImage(logoData, "PNG", 14, 15, 45, 8 * (45 / 45));
    } else {
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("OPTILINE", 14, 25);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(164, 94, 255);
    doc.text("OFFICIAL COMMISSION STATEMENT", 140, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generated: ${dateStr}`, 140, 24);
    doc.text(`Partner: ${partnerName}`, 140, 29);
    
    let y = 60;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Transaction History", 14, y);
    y += 5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 12; 
    
    doc.setFillColor(230, 230, 235);
    doc.rect(14, y - 6, 182, 10, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("DATE", 18, y);
    doc.text("PACKAGE", 50, y);
    doc.text("REF ID", 90, y);
    doc.text("AMOUNT", 140, y);
    doc.text("STATUS", 170, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    
    if (currentTransactions.length === 0) {
      doc.text("No transactions recorded.", 18, y);
      y += 10;
    } else {
      currentTransactions.forEach((tx, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(240, 240, 245);
          doc.rect(14, y - 6, 182, 8, "F");
        }
        doc.setFontSize(9);
        doc.text(tx.date || "-", 18, y);
        doc.setFont("helvetica", "bold");
        doc.text(tx.package || "-", 50, y);
        doc.setFont("helvetica", "normal");
        doc.text(tx.ref || "-", 90, y);
        doc.text(`$${tx.commission}`, 140, y);
        doc.text(tx.status || "Completed", 170, y);
        y += 8;
        if (y > 270) { doc.addPage(); y = 20; }
      });
    }

    if (y > 240) { doc.addPage(); y = 20; }
    else { y += 20; } 
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Withdrawal History", 14, y);
    y += 5;
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 12; 
    
    doc.setFillColor(230, 230, 235);
    doc.rect(14, y - 6, 182, 10, "F");
    doc.setFontSize(9);
    doc.text("DATE", 18, y);
    doc.text("METHOD", 60, y);
    doc.text("AMOUNT", 120, y);
    doc.text("STATUS", 170, y);
    y += 12;
    doc.setFont("helvetica", "normal");

    if (currentWithdrawals.length === 0) {
      doc.text("No withdrawal requests found.", 18, y);
    } else {
      currentWithdrawals.forEach((w, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(240, 240, 245);
          doc.rect(14, y - 6, 182, 8, "F");
        }
        doc.setFontSize(9);
        doc.text(w.date || "-", 18, y);
        doc.setFont("helvetica", "bold");
        doc.text(w.method || "-", 60, y);
        doc.setFont("helvetica", "normal");
        doc.text(`-$${parseFloat(w.amount || 0).toLocaleString()}`, 120, y);
        let stat = w.status === "Paid" ? "Completed" : (w.status || "Pending");
        doc.text(stat, 170, y);
        y += 8;
        if (y > 270) { doc.addPage(); y = 20; }
      });
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(0, 0, 0);
      doc.line(14, 280, 196, 280);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
      doc.text("OPTILINE - Partner Success Program", 105, 285, { align: "center" });
    }
    doc.save(`OPTILINE_Report_${partnerName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
  }

  function attemptLogin() {
    const id = els.pid.value.trim();
    const pass = els.ppass.value.trim();
    if (!id || !pass) {
      showError("Please enter valid Partner ID and Access Key.");
      return;
    }
    els.authBtn.disabled = true;
    els.authBtn.querySelector(".btn-txt").textContent = "Authenticating...";
    if(els.authError) els.authError.style.display = "none";
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "partner_login",
        partnerId: id,
        password: pass,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          data.data.password = pass;
          localStorage.setItem(SESSION_KEY, JSON.stringify({
            data: data.data,
            lastActivity: Date.now()
          }));
          loadDashboard(data.data);
        } else {
          showError(
            data.message || "Invalid credentials. Please check your Partner ID and Access Key."
          );
          resetBtn();
        }
      })
      .catch((err) => {
        showError("Connection failed. Please check your internet or try again later.");
        resetBtn();
      });
  }

  function showError(msg) {
    if(els.authError) {
      els.authError.textContent = msg;
      els.authError.style.display = "block";
      if (typeof gsap !== "undefined") {
        gsap.from(els.authError, { y: -10, opacity: 0, duration: 0.3 });
      }
    }
  }

  function resetBtn() {
    if(els.authBtn) {
      els.authBtn.disabled = false;
      els.authBtn.querySelector(".btn-txt").textContent = "Access Dashboard";
    }
  }

  function animateVal(element, finalValue, prefix = "", duration = 2) {
    if (!element) return;
    if (typeof gsap === "undefined") {
      element.textContent = prefix + finalValue.toLocaleString();
      return;
    }
    element.textContent = prefix + "0";
    const obj = { val: 0 };
    gsap.to(obj, {
      val: finalValue,
      duration: duration,
      ease: "power2.out",
      onUpdate: function () {
        element.textContent = prefix + Math.floor(obj.val).toLocaleString();
      },
      onComplete: function () {
        element.textContent = prefix + finalValue.toLocaleString();
      },
    });
  }

  function loadDashboard(data, isRefresh = false) {
    if(els.pName) els.pName.textContent = data.partnerId || "Partner";
    if(els.refLink) els.refLink.textContent = `${window.location.origin}/?ref=${data.partnerId}`;
    
    currentTransactions = data.transactions || [];
    currentWithdrawals = data.withdrawals || [];
    
    currentTransactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    currentWithdrawals.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    
    const totalComm = data.commission || 0;
    const totalWithdrawn = data.withdrawn || 0;
    const availableBalance = totalComm - totalWithdrawn;
    const totalSales = data.sales || 0;
    
    const valAvail = document.getElementById("valAvail");
    if(valAvail) animateVal(valAvail, availableBalance, "$");
    
    animateVal(els.valComm, totalComm, "$");
    animateVal(els.valSales, totalSales, "");
    
    renderTable(currentTransactions);
    renderWithdrawalTable(currentWithdrawals);
    updateCharts(currentTransactions);
    updateMilestones(totalComm);
    initializeTipSystem();
    setupExportButtons();
    initSmartLinkBuilder();
    initOrganicFeed();
    updateAIInsights(currentTransactions);
    initializeTableToggles();
    
    document.documentElement.classList.add('is-logged-in');
    
    if (isRefresh) {
      if(els.loginStage) els.loginStage.classList.remove("active");
      if(els.dashStage) els.dashStage.classList.remove("hidden");
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }

    if (typeof gsap !== "undefined") {
      const tl = gsap.timeline();
      tl.to(els.loginStage, {
        opacity: 0,
        y: -20,
        duration: 0.5,
        ease: "power2.in",
        onComplete: () => {
          if(els.loginStage) els.loginStage.classList.remove("active");
          if(els.dashStage) els.dashStage.classList.remove("hidden");
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        },
      }).fromTo(
        ".anim-dash",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.2)",
        },
      );
    } else {
      if(els.loginStage) els.loginStage.classList.remove("active");
      if(els.dashStage) {
        els.dashStage.classList.remove("hidden");
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        els.dashStage.classList.add("active");
      }
    }
  }

  function renderWithdrawalTable(withdrawals) {
  const wBody = els.withdrawalTableBody;
  if (!wBody) return;
  wBody.innerHTML = "";
  
  if (!withdrawals || withdrawals.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" class="empty-state">No withdrawals requested yet.</td>`;
    wBody.appendChild(tr);
    return;
  }
  
  withdrawals.forEach((w) => {
    const tr = document.createElement("tr");
    
    let amount = 0;
    try {
      amount = parseFloat(w.amount) || 0;
    } catch (e) {
      amount = 0;
    }
    
    let status = w.status || "Pending";
    if (status === "Paid") status = "Completed";
    
    let statusClass = status === "Completed" ? "color:#10B981;" : "color:#F59E0B;";
    let method = w.method || "PayPal";
    
    tr.innerHTML = `
      <td>${w.date ? w.date.split("T")[0] : new Date().toISOString().split("T")[0]}</td>
      <td style="color:#c48df5; font-weight:700">$${amount.toLocaleString()}</td>
      <td><span class="package-badge" style="background:rgba(164, 94, 255, 0.1)">${method}</span></td>
      <td style="text-align: center;"><span style="${statusClass}" class="status-badge">${status}</span></td>
    `;
    wBody.appendChild(tr);
  });
}
  function initializeTableToggles() {
  const tables = [
    { container: document.getElementById("txTableContainer"), tableBody: els.tableBody, toggleBtn: document.getElementById("toggleTxTableBtn"), fade: document.getElementById("txTableFade"), btnText: document.getElementById("txBtnText"), btnIcon: document.getElementById("txBtnIcon"), title: document.getElementById("ledgerTitle") },
    { container: document.getElementById("withdrawTableContainer"), tableBody: els.withdrawalTableBody, toggleBtn: document.getElementById("toggleWithdrawTableBtn"), fade: document.getElementById("withdrawTableFade"), btnText: document.getElementById("withdrawBtnText"), btnIcon: document.getElementById("withdrawBtnIcon"), title: document.getElementById("withdrawTitle") }
  ];

  tables.forEach(table => {
    if (!table.container || !table.tableBody || !table.toggleBtn || !table.fade) return;

    const rows = table.tableBody.children.length;
    if (rows <= 4) {
      table.toggleBtn.style.display = "none";
      table.fade.style.display = "none";
      table.container.style.maxHeight = "none";
      table.container.style.overflowY = "visible";
      return;
    }

    table.container.style.maxHeight = "220px";
    table.container.style.overflowY = "hidden";
    table.fade.style.display = "block";
    table.toggleBtn.style.display = "block";

    table.toggleBtn.onclick = function() {
      if (table.container.style.maxHeight === "220px") {
        table.container.style.maxHeight = table.container.scrollHeight + 50 + "px";
        table.fade.style.display = "none";
        if (table.btnText) table.btnText.textContent = "Collapse Table";
        if (table.btnIcon) table.btnIcon.className = "fas fa-chevron-up";
      } else {
        table.container.style.maxHeight = "220px";
        table.fade.style.display = "block";
        if (table.btnText) table.btnText.textContent = "Show Full Table";
        if (table.btnIcon) table.btnIcon.className = "fas fa-chevron-down";
        if (table.title) {
          const yOffset = -70;
          const y = table.title.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    };
  });
}

  function renderTable(txs) {
    const tableBody = els.tableBody;
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (txs.length === 0) {
      for (let i = 0; i < 3; i++) {
        const tr = document.createElement("tr");
        tr.style.opacity = "0.35";
        tr.style.pointerEvents = "none";
        tr.innerHTML = `
          <td style="color: #666; font-family: monospace;">--/--/----</td>
          <td><span class="package-badge" style="background: #2a2a2a; color: #555; border: 1px solid #333;">Waiting</span></td>
          <td style="color: #666; font-family: monospace;">--------</td>
          <td style="color: #666; font-weight:700">$0.00</td>
          <td style="text-align: center;"><span style="color: #666; background: rgba(255,255,255,0.05);" class="status-badge">Inactive</span></td>
        `;
        tableBody.appendChild(tr);
      }
      return;
    }

    txs.forEach((tx) => {
      const tr = document.createElement("tr");
      let statusStyle = "color:#F59E0B; background:rgba(245,158,11,0.1);";
      let statusText = tx.status;
      if (tx.status === "Completed" || tx.status === "Paid") {
        statusStyle = "color:#10B981; background:rgba(16,185,129,0.1); font-weight:600;";
        statusText = "Paid";
      } else if (tx.status === "Pending") {
        statusText = "Pending";
      }

      let pkgStyle = "background: rgba(255,255,255,0.1); color: #fff;";
      const pkgLower = (tx.package || "").toLowerCase();
      if (pkgLower.includes("core")) pkgStyle = "background: rgba(170, 114, 231, 0.15); color: #aa72e7; border: 1px solid rgba(170, 114, 231, 0.3);";
      else if (pkgLower.includes("nexus")) pkgStyle = "background: rgba(121, 52, 185, 0.15); color: #c48df5; border: 1px solid rgba(121, 52, 185, 0.3);";
      else if (pkgLower.includes("matrix")) pkgStyle = "background: rgba(53, 18, 80, 0.4); color: #e1c0ff; border: 1px solid rgba(164, 94, 255, 0.3);";

      tr.innerHTML = `
        <td>${tx.date ? tx.date.split("T")[0] : "N/A"}</td>
        <td><span class="package-badge" style="${pkgStyle}">${tx.package || "N/A"}</span></td>
        <td>${tx.ref || "-"}</td>
        <td style="color:var(--accent-light);font-weight:700">$${parseFloat(tx.commission || "0").toLocaleString()}</td>
        <td style="text-align: center;"><span style="${statusStyle}" class="status-badge">${statusText}</span></td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function updateCharts(txs) {
    const packageCounts = {};
    const earningsByDate = {};
    txs.forEach((tx) => {
      const pkg = tx.package || "Unknown";
      packageCounts[pkg] = (packageCounts[pkg] || 0) + 1;
      const date = tx.date ? tx.date.split("T")[0] : "N/A";
      if (date !== "N/A") {
        earningsByDate[date] = (earningsByDate[date] || 0) + (parseFloat(tx.commission) || 0);
      }
    });

    const isDummy = txs.length === 0;

    const packageCtx = document.getElementById("packageChart");
    if (packageCtx && typeof Chart !== "undefined") {
      if (charts.package) charts.package.destroy();

      let pLabels, pData, pColors;

      if (isDummy) {
        pLabels = ["Core", "Nexus", "Matrix"];
        pData = [1, 1, 1];
        pColors = ["#262626", "#333333", "#404040"];
      } else {
        pLabels = Object.keys(packageCounts);
        pData = Object.values(packageCounts);
        const colorMap = { core: "#aa72e7", nexus: "#7934b9", matrix: "#351250" };
        const fallbackColor = "#bcb4c5";
        pColors = pLabels.map((pkgName) => {
          const nameLower = pkgName.toLowerCase();
          if (nameLower.includes("core")) return colorMap.core;
          if (nameLower.includes("nexus")) return colorMap.nexus;
          if (nameLower.includes("matrix")) return colorMap.matrix;
          return fallbackColor;
        });
      }

      charts.package = new Chart(packageCtx, {
        type: "doughnut",
        data: {
          labels: pLabels,
          datasets: [{
            data: pData,
            backgroundColor: pColors,
            borderWidth: 0,
            hoverOffset: isDummy ? 0 : 15,
            borderColor: "rgba(18, 8, 47, 0.5)",
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { animateScale: true, animateRotate: true, duration: 1500, easing: "easeOutQuart" },
          hover: { mode: "nearest", intersect: true },
          cutout: "80%",
          layout: { padding: { top: 0, bottom: 15, left: 10, right: 10 } },
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: isDummy ? "#555" : "#F0F0F8", font: { family: "Inter", size: 12 }, padding: 20, usePointStyle: true },
            },
            tooltip: {
              enabled: !isDummy,
              backgroundColor: "rgba(10, 10, 26, 0.9)",
              titleColor: "#A45EFF",
              bodyColor: "#fff",
              borderColor: "rgba(138, 43, 226, 0.3)",
              borderWidth: 1,
              callbacks: {
                label: (context) => {
                  const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                  const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                  return ` ${context.label}: ${context.parsed} Sales (${percentage}%)`;
                },
              },
            },
          },
        },
      });
    }

    const trendCtx = document.getElementById("earningsTrendChart");
    if (trendCtx && typeof Chart !== "undefined") {
      if (charts.trend) charts.trend.destroy();

      let tLabels, tData, tBg, tBorder;

      if (isDummy) {
        tLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        tData = [200, 450, 300, 550, 400, 600, 350];
        tBg = "rgba(255, 255, 255, 0.03)";
        tBorder = "rgba(255, 255, 255, 0.05)";
      } else {
        const sortedDates = Object.keys(earningsByDate).filter((d) => d !== "N/A").sort((a, b) => new Date(a) - new Date(b));
        tLabels = sortedDates;
        tData = sortedDates.map((d) => earningsByDate[d]);
        tBg = "rgba(164, 94, 255, 0.7)";
        tBorder = "rgba(138, 43, 226, 1)";
      }

      let ctxGradient = trendCtx.getContext("2d");
      let gradient = ctxGradient.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, "rgba(164, 94, 255, 0.8)");
      gradient.addColorStop(1, "rgba(164, 94, 255, 0.1)");

      let hoverGradient = ctxGradient.createLinearGradient(0, 0, 0, 400);
      hoverGradient.addColorStop(0, "rgba(138, 43, 226, 0.95)");
      hoverGradient.addColorStop(1, "rgba(138, 43, 226, 0.2)");

      charts.trend = new Chart(trendCtx, {
        type: "bar",
        data: {
          labels: tLabels,
          datasets: [{
            label: isDummy ? "No Data" : "Earnings ($)",
            data: tData,
            backgroundColor: isDummy ? "rgba(255, 255, 255, 0.05)" : gradient,
            borderColor: isDummy ? "rgba(255, 255, 255, 0.1)" : "#A45EFF",
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.5,
            hoverBackgroundColor: isDummy ? "rgba(255, 255, 255, 0.08)" : hoverGradient,
            hoverBorderColor: isDummy ? "rgba(255, 255, 255, 0.2)" : "#8A2BE2"
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { y: { duration: 1500, easing: 'easeOutQuart' } },
          scales: {
            y: {
              beginAtZero: true,
              display: !isDummy,
              grid: { color: "rgba(255, 255, 255, 0.05)", drawBorder: false },
              ticks: { color: "#9ca3af", callback: function (value) { return "$" + value; }, font: { family: "Inter", size: 11 } }
            },
            x: {
              display: !isDummy,
              grid: { display: false },
              ticks: { color: "#9ca3af", font: { family: "Inter", size: 11 } },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: !isDummy,
              backgroundColor: "rgba(18, 8, 47, 0.95)",
              titleColor: "#c48df5",
              bodyColor: "#ffffff",
              borderColor: "rgba(164, 94, 255, 0.4)",
              borderWidth: 1,
              padding: 12,
              displayColors: false,
              callbacks: {
                label: function (context) { return `Earnings: $${context.parsed.y}`; },
              },
            },
          },
        },
      });
    }
  }

  function updateMilestones(totalComm) {
    if (typeof gsap === "undefined") return;
    els.milestoneCards.forEach((card) => {
      const target = parseInt(card.getAttribute("data-target"));
      const progress = Math.min(100, (totalComm / target) * 100);
      const fillElement = card.querySelector(".m-fill");
      const currentValElement = card.querySelector(".m-current-val");
      gsap.to(fillElement, { width: `${progress}%`, duration: 1.5, ease: "power2.out" });
      const startVal = parseFloat(currentValElement.textContent.replace("$", "").replace(/,/g, "")) || 0;
      const finalVal = Math.min(totalComm, target);
      gsap.to(
        { value: startVal },
        {
          value: finalVal,
          duration: 1.5,
          ease: "power2.out",
          onUpdate: function () { currentValElement.textContent = `$${Math.floor(this.vars.value).toLocaleString()}`; },
          onComplete: function () { currentValElement.textContent = `$${finalVal.toLocaleString()}`; },
        }
      );
      if (totalComm >= target) {
        card.classList.remove("locked");
        card.classList.add("unlocked");
        gsap.to(card, { scale: 1.02, duration: 0.5, ease: "back.out(1.7)", boxShadow: "0 0 30px rgba(138, 43, 226, 0.4)" });
      } else {
        card.classList.remove("unlocked");
        card.classList.add("locked");
        gsap.to(card, { scale: 1, duration: 0.5, ease: "power2.out" });
      }
    });
  }

  function initSmartLinkBuilder() {
    if (els.generateLinkBtn) {
      els.generateLinkBtn.addEventListener("click", () => {
        const baseUrl = document.getElementById("targetPage").value;
        const tag = document.getElementById("campaignTag").value.trim();
        let partnerId = "PARTNER";
        if (els.pName && els.pName.textContent !== "Partner") {
          partnerId = els.pName.textContent;
        } else {
          try {
            const refText = els.refLink.textContent;
            if (refText.includes("=")) partnerId = refText.split("=")[1];
          } catch (e) {}
        }
        let finalUrl = `${baseUrl}?ref=${partnerId}`;
        if (tag) finalUrl += `&camp=${tag}`;
        if (els.smartLinkOutput && els.resultContainer) {
          els.smartLinkOutput.textContent = finalUrl;
          els.resultContainer.style.display = "block";
          if (typeof gsap !== "undefined") gsap.from(els.resultContainer, { y: -10, opacity: 0, duration: 0.4 });
        }
      });
    }
    if (els.copySmartLinkBtn) {
      els.copySmartLinkBtn.addEventListener("click", () => {
        const text = els.smartLinkOutput.textContent;
        navigator.clipboard.writeText(text).then(() => {
          const originalText = els.copySmartLinkBtn.textContent;
          els.copySmartLinkBtn.textContent = "Copied!";
          els.copySmartLinkBtn.style.background = "#10B981";
          els.copySmartLinkBtn.style.color = "white";
          setTimeout(() => {
            els.copySmartLinkBtn.textContent = originalText;
            els.copySmartLinkBtn.style.background = "";
            els.copySmartLinkBtn.style.color = "";
          }, 2000);
        });
      });
    }
  }

  function initOrganicFeed() {
    if (!els.feedTrack) return;
    const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy"];
    const lastInitials = ["H.", "S.", "B.", "M.", "W.", "K.", "C.", "P.", "R.", "D."];
    const locations = ["North America", "Europe", "Asia Pacific", "Western Europe", "South America", "Australia", "Eastern Europe", "Northern America"];
    const actions = [
      { type: "sale", text: "generated a new commission", amount: "$100", icon: "fa-dollar-sign" },
      { type: "sale", text: "generated a new commission", amount: "$150", icon: "fa-dollar-sign" },
      { type: "sale", text: "generated a new commission", amount: "$200", icon: "fa-dollar-sign" },
      { type: "join", text: "joined the partner network", amount: "", icon: "fa-user-plus" },
      { type: "milestone", text: "reached Silver Status", amount: "", icon: "fa-trophy" },
    ];
    function createFeedItem() {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lInit = lastInitials[Math.floor(Math.random() * lastInitials.length)];
      const fullName = `${fName} ${lInit}`;
      const action = actions[Math.floor(Math.random() * actions.length)];
      const loc = locations[Math.floor(Math.random() * locations.length)];
      let detailHtml = "";
      let iconClass = "";
      if (action.type === "sale") {
        detailHtml = `<span style="color:#A45EFF; font-weight:700; text-shadow:0 0 10px rgba(164, 94, 255, 0.3);">${action.amount}</span>`;
        iconClass = "sale";
      } else if (action.type === "join") {
        iconClass = "join";
        detailHtml = "";
      } else {
        iconClass = "sale";
        detailHtml = "";
      }
      const item = document.createElement("div");
      item.className = "feed-item";
      item.innerHTML = `
        <div class="feed-icon ${iconClass}"><i class="fas ${action.icon}"></i></div>
        <div class="feed-info">
          <span class="feed-text"><strong>${fullName}</strong> ${action.text} ${detailHtml}</span>
          <span class="feed-meta">Active in ${loc}</span>
        </div>
      `;
      els.feedTrack.prepend(item);
      setTimeout(() => item.classList.add("show"), 100);
      if (els.feedTrack.children.length > 4) {
        const lastItem = els.feedTrack.lastElementChild;
        lastItem.style.opacity = "0";
        setTimeout(() => lastItem.remove(), 600);
      }
    }
    function organicLoop() {
      const randTime = Math.floor(Math.random() * 47000) + 8000;
      setTimeout(() => {
        if (Math.random() > 0.2) createFeedItem();
        organicLoop();
      }, randTime);
    }
    setTimeout(createFeedItem, 2000);
    organicLoop();
  }

  function updateAIInsights(txs) {
    const aiForecast = document.getElementById("aiForecast");
    const aiVelocity = document.getElementById("aiVelocity");
    const aiVelocityText = document.getElementById("aiVelocityText");
    const aiAdvice = document.getElementById("aiAdvice");
    if (!aiForecast) return;

    if (txs.length === 0) {
      aiForecast.innerHTML = '<span style="color: #444;">$0.00</span>';
      aiVelocity.innerHTML = '<span style="color: #444;">0%</span>';
      if (aiVelocityText) { aiVelocityText.textContent = "System Standby"; aiVelocityText.style.color = "#555"; }
      if (aiAdvice) { aiAdvice.textContent = "System active. Waiting for initial transaction data to generate predictive strategy."; aiAdvice.style.color = "#777"; aiAdvice.style.fontStyle = "italic"; }
      return;
    }

    const totalComm = txs.reduce((sum, tx) => sum + (parseFloat(tx.commission) || 0), 0);
    const date = new Date();
    const dayOfMonth = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    let projected = 0;
    if (totalComm > 0 && dayOfMonth > 0) projected = (totalComm / dayOfMonth) * daysInMonth;
    
    animateVal(aiForecast, Math.floor(projected), "$");
    let velocityScore = 0;
    let velocityMsg = "Gathering more data...";
    if (txs.length >= 2) {
      const recentAvg = (parseFloat(txs[0].commission) + parseFloat(txs[1].commission)) / 2;
      const overallAvg = totalComm / txs.length;
      const change = ((recentAvg - overallAvg) / overallAvg) * 100;
      velocityScore = Math.floor(change);
      if (velocityScore > 0) {
        velocityMsg = "Trending Upwards 🚀";
        aiVelocity.style.color = "#A45EFF";
      } else {
        velocityMsg = "Cooling Down ⏸️";
        aiVelocity.style.color = "#a569f5";
      }
    } else {
      velocityScore = 0;
      velocityMsg = "Gathering data...";
    }
    aiVelocity.textContent = (velocityScore > 0 ? "+" : "") + velocityScore + "%";
    if (aiVelocityText) aiVelocityText.textContent = velocityMsg;
    
    let advice = "";
    const matrixCount = txs.filter((t) => t.package === "Matrix").length;
    if (matrixCount === 0 && txs.length > 3) {
      advice = "Detected high volume of basic tiers. OPPORTUNITY: Upsell 'Matrix' package to increase margins by 40%. Target senior clients.";
    } else if (velocityScore < -10) {
      advice = "Velocity drop detected. Engagement metrics are cooling. Suggested action: Refresh your creative assets or re-post high-performing content.";
    } else if (projected > 5000) {
      advice = "Excellent momentum! You are on track to hit 'Gold Tier' this month. Maintain current consistency to unlock the bonus multiplier.";
    } else {
      advice = "Traffic quality is stable. Analyzing conversion rates... Suggest focusing on 'Nexus' package for optimal conversion-to-revenue ratio.";
    }
    if (aiAdvice) {
      aiAdvice.textContent = "";
      let i = 0;
      const typeWriter = () => {
        if (i < advice.length) {
          aiAdvice.textContent += advice.charAt(i);
          i++;
          setTimeout(typeWriter, 30);
        }
      };
      typeWriter();
    }
  }

});

const messageInput = document.getElementById("partnerMessage");
const strengthBar = document.getElementById("msgStrengthBar");
const strengthText = document.getElementById("msgStrengthText");
if (messageInput && strengthBar) {
  messageInput.addEventListener("input", () => {
    const val = messageInput.value.length;
    let width = "0%",
      color = "#ff4d4d",
      txt = "Too short";
    if (val > 20) { width = "40%"; color = "#F59E0B"; txt = "Weak"; }
    if (val > 50) { width = "70%"; color = "#6366F1"; txt = "Good"; }
    if (val > 100) { width = "100%"; color = "#10B981"; txt = "Strong!"; }
    strengthBar.style.width = width;
    strengthBar.style.background = color;
    strengthText.textContent = "Message strength: " + txt;
  });
}

const inputsToSave = ["partnerName", "partnerPhone", "partnerEmail", "partnerSocial", "partnerMessage"];
inputsToSave.forEach((id) => {
  const savedVal = localStorage.getItem(id);
  if (savedVal && document.getElementById(id)) document.getElementById(id).value = savedVal;
});

inputsToSave.forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => localStorage.setItem(id, el.value));
});

document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("policyToggle");
  const closeBtn = document.getElementById("closePolicyBtn");
  const section = document.getElementById("policySection");

  if (toggleBtn && section) {
    toggleBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      section.classList.toggle("active");
    };
  }

  if (closeBtn && section) {
    closeBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      section.classList.remove("active");
      setTimeout(function () {
        const headerOffset = 100;
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }, 600);
    };
  }

  const secureBtns = document.querySelectorAll('.secure-dl-btn');
  secureBtns.forEach(btn => {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      if (!this.classList.contains('confirm-ready')) {
        this.classList.add('confirm-ready');
        gsap.to(this, {
          scale: 0.92, opacity: 0.7, duration: 0.1,
          onComplete: () => {
            this.innerHTML = '<i class="fas fa-check-double"></i> Click Again to Confirm';
            this.style.background = '#5a189a';
            gsap.to(this, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" });
          }
        });
        clearTimeout(this.resetTimer);
        this.resetTimer = setTimeout(() => {
          this.classList.remove('confirm-ready');
          gsap.to(this, {
            scale: 0.92, opacity: 0.7, duration: 0.1,
            onComplete: () => {
              this.innerHTML = this.dataset.originalHtml;
              this.style.background = '';
              gsap.to(this, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" });
            }
          });
        }, 3000);
      } else {
        clearTimeout(this.resetTimer);
        const fileKey = this.getAttribute('data-file');
        const sessionData = localStorage.getItem(SESSION_KEY);
        
        if (!fileKey) {
          alert('Error: No file specified');
          this.classList.remove('confirm-ready');
          this.innerHTML = this.dataset.originalHtml;
          this.style.background = '';
          return;
        }
        
        if (!sessionData) {
          window.location.href = '/psp/';
          return;
        }
        
        try {
          const parsed = JSON.parse(sessionData);
          const now = Date.now();
          
          if (now - parsed.lastActivity > 30 * 60 * 1000) {
            localStorage.removeItem(SESSION_KEY);
            window.location.href = '/psp/';
            return;
          }
          
          parsed.lastActivity = now;
          localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
          
          gsap.to(this, {
            scale: 1.1, duration: 0.2, ease: "power2.out",
            onComplete: () => {
              window.open(`/partner-assets?file=${fileKey}`, '_blank');
              setTimeout(() => {
                this.classList.remove('confirm-ready');
                this.innerHTML = this.dataset.originalHtml;
                this.style.background = '';
                gsap.to(this, { scale: 1, duration: 0.2 });
              }, 500);
            }
          });
        } catch (e) {
          window.location.href = '/psp/';
        }
      }
    });
  });
});
