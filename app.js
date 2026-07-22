/**
 * Gaby & Chris Wedding Invitation SPA Logic
 * Features: Countdown, URL parameters RSVP config, Card Flipping, Scroll Reveal, Webhook integration.
 */

// ==========================================================================
// CONFIGURATION
// ==========================================================================
// If you have set up a Google Sheets Webhook via Google Apps Script, paste the URL here.
// Leaving it empty will run the RSVP form in "Simulation Mode" (simulates successful submission).
const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyGNyQn20Pw71GXmgkIt50rdwAmAvTnC2wX_oNz7JmiaYTKffsPIKFWOmC3sJ-TPGwkVQ/exec";

// Paste your WhatsApp Phone Number here (including country code, e.g., '52' for Mexico and 10 digits: '525512345678')
const WHATSAPP_PHONE_NUMBER = "527751234567";

// Target Date: 24th October 2026, 1:00 PM (13:00 HRS)
// Note: In JavaScript, months are 0-indexed (January = 0, October = 9)
const WEDDING_DATE = new Date(2026, 9, 24, 13, 0, 0);

// ==========================================================================
// INITIALIZATION & DOMELEMENTS
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initCountdown();
    initUrlParams();
    initLocationCards();
    initScrollReveal();
    initRsvpForm();
    initLightbox();
});

// ==========================================================================
// COUNTDOWN TIMER
// ==========================================================================
function initCountdown() {
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");
    
    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    function updateTimer() {
        const now = new Date();
        const difference = WEDDING_DATE - now;

        if (difference <= 0) {
            daysEl.textContent = "00";
            hoursEl.textContent = "00";
            minutesEl.textContent = "00";
            secondsEl.textContent = "00";
            clearInterval(timerInterval);
            return;
        }

        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);

        daysEl.textContent = d.toString().padStart(2, "0");
        hoursEl.textContent = h.toString().padStart(2, "0");
        minutesEl.textContent = m.toString().padStart(2, "0");
        secondsEl.textContent = s.toString().padStart(2, "0");
    }

    updateTimer(); // Initial call
    const timerInterval = setInterval(updateTimer, 1000);
}

// ==========================================================================
// URL PARAMETERS & CUSTOMIZED GREETING (i & p)
// ==========================================================================
function initUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Parse invitee name (?i=)
    const rawInvitee = urlParams.get("i");
    const inviteeName = rawInvitee ? decodeURIComponent(rawInvitee).trim() : "";
    
    // Parse max tickets (?p=)
    const rawPases = urlParams.get("p");
    let maxPases = parseInt(rawPases, 10);
    if (isNaN(maxPases) || maxPases <= 0) {
        maxPases = 2; // Default to 2 if empty or invalid
    }

    // Set Greeting Text
    const greetingTextEl = document.getElementById("rsvp-greeting-text");
    const inputNameEl = document.getElementById("input-name");
    const nameGroupEl = document.getElementById("name-group");
    const inviteeHiddenEl = document.getElementById("invitee-name-hidden");
    const pasesHiddenEl = document.getElementById("pases-max-hidden");

    if (inviteeName) {
        greetingTextEl.innerHTML = `¡Hola <strong>${inviteeName}</strong>!<br>Nos encantaría contar con tu presencia en este gran día.`;
        // Prefill name input and make it not required (since it's hidden)
        if (inputNameEl) {
            inputNameEl.value = inviteeName;
            inputNameEl.removeAttribute("required");
        }
        // Hide name group since we already know who they are
        if (nameGroupEl) {
            nameGroupEl.classList.add("hidden");
        }
        // Keep hidden record
        if (inviteeHiddenEl) inviteeHiddenEl.value = inviteeName;
    } else {
        greetingTextEl.innerHTML = `¡Nos encantaría contar con tu presencia en este gran día!`;
        if (nameGroupEl) {
            nameGroupEl.classList.remove("hidden");
        }
        if (inputNameEl) {
            inputNameEl.setAttribute("required", "required");
        }
    }
    
    if (pasesHiddenEl) pasesHiddenEl.value = maxPases;

    // Update the assigned tickets display badge
    const assignedTicketsCountEl = document.getElementById("assigned-tickets-count");
    if (assignedTicketsCountEl) {
        assignedTicketsCountEl.textContent = `${maxPases} ${maxPases === 1 ? 'pase' : 'pases'}`;
    }
}

// ==========================================================================
// INTERACTIVE 3D FLIP CARDS
// ==========================================================================
function initLocationCards() {
    const cardCeremony = document.getElementById("card-ceremony");
    const cardReception = document.getElementById("card-reception");
    
    function setupCardFlip(card) {
        if (!card) return;
        
        // Flip on card body click
        card.addEventListener("click", () => {
            card.classList.toggle("flipped");
        });

        // Prevent flipping back when clicking the "Abrir Mapa" button
        const mapBtn = card.querySelector(".btn-map");
        if (mapBtn) {
            mapBtn.addEventListener("click", (e) => {
                e.stopPropagation();
            });
        }
        
        // Handle explicit "Volver" button inside the back face
        const backBtn = card.querySelector(".btn-flip-back");
        if (backBtn) {
            backBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                card.classList.remove("flipped");
            });
        }
    }

    setupCardFlip(cardCeremony);
    setupCardFlip(cardReception);
}

// ==========================================================================
// SCROLL REVEAL EFFECTS
// ==========================================================================
function initScrollReveal() {
    // Setup observer options
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1
    };

    // Callback function for observer
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
                // Once animation is triggered, we can stop observing it
                observer.unobserve(entry.target);
            }
        });
    };

    // Create standard observer
    const observer = new IntersectionObserver(revealCallback, observerOptions);

    // Observe all sections and grid items
    const elementsToReveal = document.querySelectorAll(".reveal, .reveal-item, .reveal-card");
    
    if (elementsToReveal.length > 0) {
        elementsToReveal.forEach(el => {
            observer.observe(el);
        });
    } else {
        // Fallback: If observer isn't triggered or elements missing, show all
        document.querySelectorAll(".reveal, .reveal-item").forEach(el => {
            el.classList.add("revealed");
        });
    }
}

// ==========================================================================
// RSVP FORM CONTROL & WEBHOOK INTEGRATION
// ==========================================================================
function initRsvpForm() {
    const form = document.getElementById("rsvp-form");
    const submitBtn = document.getElementById("rsvp-submit");
    const successBox = document.getElementById("rsvp-success-box");
    const attendanceSelect = document.getElementById("select-attendance");
    const ticketsInfoGroup = document.getElementById("tickets-info-group");
    const allergiesGroup = document.getElementById("allergies-group");
    
    if (!form || !submitBtn || !successBox) return;

    // Helper: Reset confirmation status in browser if ?clear=true is in URL
    const urlParams = new URLSearchParams(window.location.search);

    // Set dynamic WhatsApp help link
    const helpWppBtn = document.getElementById("btn-help-whatsapp");
    if (helpWppBtn) {
        const guestNameParam = urlParams.get("i") || "";
        const introMsg = guestNameParam 
            ? `¡Hola Gaby y Chris! ✨ Soy ${guestNameParam}. Les escribo para confirmarles nuestra asistencia a su boda.`
            : `¡Hola Gaby y Chris! ✨ Les escribo para confirmarles mi asistencia a su boda.`;
        helpWppBtn.href = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(introMsg)}`;
    }
    if (urlParams.get("clear") === "true") {
        localStorage.removeItem("rsvp_confirmed");
    }

    // Toggle Tickets Info and Allergies fields based on attendance choice
    if (attendanceSelect) {
        attendanceSelect.addEventListener("change", () => {
            if (attendanceSelect.value === "no") {
                if (ticketsInfoGroup) ticketsInfoGroup.classList.add("hidden");
                if (allergiesGroup) allergiesGroup.classList.add("hidden");
            } else {
                if (ticketsInfoGroup) ticketsInfoGroup.classList.remove("hidden");
                if (allergiesGroup) allergiesGroup.classList.remove("hidden");
            }
        });
    }

    // Helper: Generate .ics file for calendar attachment
    function generateIcsFile() {
        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Gaby y Chris Boda//NONSGML v1.0//EN",
            "BEGIN:VEVENT",
            "UID:" + new Date().getTime() + "@gabyandchris.me",
            "DTSTAMP:20261024T190000Z",
            "DTSTART:20261024T190000Z",
            "DTEND:20261025T050000Z",
            "SUMMARY:Boda de Gaby & Chris",
            "DESCRIPTION:Acompáñanos a celebrar nuestra boda.\\n\\n1:00 PM - Ceremonia Religiosa\\n2:30 PM - Recepción en Salón Essenzia.",
            "LOCATION:Salón Essenzia, Santiago Tulantepec, Hgo.",
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\r\n");
        return "data:text/calendar;charset=utf8," + encodeURIComponent(icsContent);
    }

    // Function to handle clean reset of local RSVP storage
    function resetRsvp() {
        localStorage.removeItem("rsvp_confirmed");
        localStorage.removeItem("rsvp_attendance");
        localStorage.removeItem("rsvp_tickets");
        const cleanParams = new URLSearchParams(window.location.search);
        cleanParams.delete("clear");
        const searchStr = cleanParams.toString();
        window.location.href = window.location.origin + window.location.pathname + (searchStr ? "?" + searchStr : "");
    }

    // Check if guest has already confirmed in this browser
    const alreadyConfirmed = localStorage.getItem("rsvp_confirmed");
    if (alreadyConfirmed === "true") {
        form.classList.add("hidden");
        successBox.classList.remove("hidden");
        
        // Hide help box since they already confirmed
        const helpBox = document.getElementById("rsvp-help-box");
        if (helpBox) helpBox.classList.add("hidden");
        
        const savedAttendance = localStorage.getItem("rsvp_attendance") || "si";
        const savedTickets = localStorage.getItem("rsvp_tickets") || "1";
        
        const successDesc = document.getElementById("rsvp-success-desc");
        const calendarBox = document.getElementById("calendar-box");
        
        if (successDesc) {
            if (savedAttendance === "si") {
                successDesc.innerHTML = `Ya has registrado tu asistencia anteriormente para <strong>${savedTickets} ${savedTickets === "1" ? 'boleto' : 'boletos'}</strong>. ¡Gracias!`;
                if (calendarBox) calendarBox.style.display = "block";
            } else {
                successDesc.innerHTML = `Ya has registrado tu asistencia anteriormente (Lamentablemente no podrás asistir). ¡Gracias!`;
                if (calendarBox) calendarBox.style.display = "none";
            }
        }
        
        // Configure iCal dynamic link on re-visits too
        const icalBtn = document.getElementById("btn-add-ical");
        if (icalBtn && savedAttendance === "si") {
            icalBtn.href = generateIcsFile();
            icalBtn.download = "Boda_Gaby_y_Chris.ics";
        }
        
        // Bind the reset button
        const resetBtn = document.getElementById("btn-reset-rsvp");
        if (resetBtn) {
            resetBtn.addEventListener("click", resetRsvp);
        }
        return;
    }

    // Form Submit Handler
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        
        // Collect form data
        const formData = new FormData(form);
        const isAttending = formData.get("attendance") === "si";
        const maxTickets = formData.get("pases_max") || "2";
        const inviteeName = formData.get("invitee_name") || "";

        const data = {
            invitee_name: inviteeName,
            pases_max: maxTickets,
            guest_name: formData.get("guest_name") || inviteeName || "Invitado General",
            guest_allergies: formData.get("guest_allergies") || "",
            attendance: formData.get("attendance"),
            tickets: isAttending ? maxTickets : "0",
            message: formData.get("message") || "",
            timestamp: new Date().toISOString()
        };

        // UI Feedback: Sending state
        submitBtn.disabled = true;
        submitBtn.classList.add("sending");
        submitBtn.textContent = "Enviando...";

        if (GOOGLE_SHEETS_WEBHOOK_URL) {
            // Actual submission to Webhook
            submitWebhook(data);
        } else {
            // Simulation Mode (Local Testing)
            console.log("Form submitted (Simulation Mode):", data);
            setTimeout(() => {
                showSuccessState(data);
            }, 1500);
        }
    });

    function submitWebhook(data) {
        const searchParams = new URLSearchParams();
        for (const key in data) {
            searchParams.append(key, data[key]);
        }

        fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
            method: "POST",
            mode: "no-cors", // Crucial for Google Apps Script Webhooks to bypass CORS issues
            body: searchParams // Pass the URLSearchParams object directly so browser sets content-type
        })
        .then(() => {
            // Because mode is 'no-cors', we won't get readable response, but the request will go through
            showSuccessState(data);
        })
        .catch((error) => {
            console.error("Error submitting RSVP:", error);
            // Fallback: Still show success so user experience is not broken, but log it
            showSuccessState(data);
        });
    }

    function showSuccessState(data) {
        submitBtn.textContent = "¡Confirmado!";
        
        // Animate out form, animate in success message
        form.classList.add("hidden");
        successBox.classList.remove("hidden");
        
        // Hide help box on success
        const helpBox = document.getElementById("rsvp-help-box");
        if (helpBox) helpBox.classList.add("hidden");
        
        const successDesc = document.getElementById("rsvp-success-desc");
        const calendarBox = document.getElementById("calendar-box");
        
        if (successDesc) {
            if (data.attendance === "si") {
                successDesc.innerHTML = `Hemos registrado tu asistencia para <strong>${data.tickets} ${data.tickets === "1" ? 'boleto' : 'boletos'}</strong>.<br>¡Nos vemos el 24 de Octubre de 2026!`;
                if (calendarBox) calendarBox.style.display = "block";
            } else {
                successDesc.innerHTML = `Lamentamos que no puedas asistir, gracias por avisarnos.<br>¡Te extrañaremos!`;
                if (calendarBox) calendarBox.style.display = "none";
            }
        }

        // Configure iCal link dynamically
        const icalBtn = document.getElementById("btn-add-ical");
        if (icalBtn && data.attendance === "si") {
            icalBtn.href = generateIcsFile();
            icalBtn.download = "Boda_Gaby_y_Chris.ics";
        }

        // Bind the reset button
        const resetBtn = document.getElementById("btn-reset-rsvp");
        if (resetBtn) {
            resetBtn.addEventListener("click", resetRsvp);
        }

        // Store confirmation status locally
        localStorage.setItem("rsvp_confirmed", "true");
        localStorage.setItem("rsvp_attendance", data.attendance);
        localStorage.setItem("rsvp_tickets", data.tickets);
    }
}

// ==========================================================================
// GALLERY LIGHTBOX SYSTEM
// ==========================================================================
function initLightbox() {
    const modal = document.getElementById("lightbox-modal");
    const modalImg = document.getElementById("lightbox-img");
    const closeBtn = document.getElementById("lightbox-close");
    const prevBtn = document.getElementById("lightbox-prev");
    const nextBtn = document.getElementById("lightbox-next");
    
    // Select all images inside polaroid cards
    const galleryImages = Array.from(document.querySelectorAll(".polaroid-card img"));
    
    if (!modal || !modalImg || galleryImages.length === 0) return;
    
    let currentIndex = 0;
    
    // Open Lightbox
    galleryImages.forEach((img, index) => {
        img.addEventListener("click", (e) => {
            e.stopPropagation();
            modal.style.display = "flex";
            modalImg.src = img.src.split('?')[0] + "?v=1.2"; // strip parameter for fresh source
            currentIndex = index;
            document.body.style.overflow = "hidden"; // Prevent scrolling behind modal
        });
    });
    
    // Close Lightbox
    function closeModal() {
        modal.style.display = "none";
        document.body.style.overflow = ""; // Restore scrolling
    }
    
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Show Image at Index
    function showImage(index) {
        if (index < 0) {
            currentIndex = galleryImages.length - 1;
        } else if (index >= galleryImages.length) {
            currentIndex = 0;
        } else {
            currentIndex = index;
        }
        
        modalImg.style.opacity = 0;
        setTimeout(() => {
            modalImg.src = galleryImages[currentIndex].src.split('?')[0] + "?v=1.2";
            modalImg.style.opacity = 1;
        }, 150);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showImage(currentIndex - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showImage(currentIndex + 1);
        });
    }
    
    // Keyboard navigation (Esc to close, Left/Right arrows to navigate)
    document.addEventListener("keydown", (e) => {
        if (modal.style.display === "flex") {
            if (e.key === "Escape") closeModal();
            if (e.key === "ArrowLeft") showImage(currentIndex - 1);
            if (e.key === "ArrowRight") showImage(currentIndex + 1);
        }
    });
    
    // Swipe gestures on mobile devices
    let touchStartX = 0;
    let touchEndX = 0;
    
    modal.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    modal.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50; // min distance in px
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swiped Left -> Show next
            showImage(currentIndex + 1);
        } else if (touchEndX > touchStartX + swipeThreshold) {
            // Swiped Right -> Show prev
            showImage(currentIndex - 1);
        }
    }
}
