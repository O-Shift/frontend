/**
 * Welcome Email Generator for OShift matching the exact Figma design
 */

export interface WelcomeEmailData {
  userName?: string;
  dashboardUrl?: string;
  logoUrl?: string;
  mascotUrl?: string;
  orangeRouteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
}

export function generateWelcomeEmailHtml(data: WelcomeEmailData = {}): string {
  const {
    userName = "there",
    dashboardUrl = "https://app.oshift.com/workspaces",
    logoUrl = "https://app.oshift.com/orange%20logo.png",
    mascotUrl = "https://app.oshift.com/mascot_bird_email.png",
    orangeRouteUrl = "https://app.oshift.com/orange%20route.png",
    facebookUrl = "https://facebook.com/oshift",
    instagramUrl = "https://instagram.com/oshift",
    linkedinUrl = "https://linkedin.com/company/oshift",
  } = data;

  const year = new Date().getFullYear().toString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to OShift</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .email-wrapper { width: 100%; max-width: 480px; margin: 0 auto; background-color: #FFFDF9; position: relative; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    
    .hero-container { position: relative; margin: 0 24px 20px 24px; padding-top: 10px; }
    .hero-box {
      background: #FF8A00;
      background: linear-gradient(135deg, #FF7A00 0%, #FF9800 50%, #FFA726 100%);
      border-radius: 28px;
      padding: 30px 24px;
      position: relative;
      box-shadow: 0 8px 20px rgba(255, 122, 0, 0.25);
    }
    .hero-title-top { font-size: 26px; font-weight: 900; color: #111111; line-height: 1.15; letter-spacing: -0.5px; }
    .hero-title-bottom { font-size: 26px; font-weight: 900; color: #FFFFFF; line-height: 1.15; letter-spacing: -0.5px; margin-top: 4px; }
    .mascot-img {
      position: absolute;
      right: -8px;
      bottom: -16px;
      width: 125px;
      height: auto;
      filter: drop-shadow(0 10px 15px rgba(0,0,0,0.15));
    }

    .wave-section {
      position: relative;
      background: url('${orangeRouteUrl}') no-repeat right center / 100% auto;
      padding: 20px 24px 40px 24px;
      min-height: 380px;
    }
    
    .card-stream {
      display: flex;
      gap: 12px;
      margin-top: 16px;
      overflow-x: visible;
    }
    .pin-card {
      background: #ECECEC;
      border-radius: 20px;
      padding: 18px 14px 16px 14px;
      position: relative;
      flex: 1;
      min-width: 0;
      box-shadow: 0 6px 16px rgba(0,0,0,0.06);
      transform-origin: center;
    }
    .pin-card.card-1 { transform: rotate(-6deg) translateY(20px); }
    .pin-card.card-2 { transform: rotate(-1deg) translateY(4px); }
    .pin-card.card-3 { transform: rotate(5deg) translateY(-14px); }
    
    .pin-dot {
      position: absolute;
      top: 10px;
      left: 12px;
      width: 14px;
      height: 14px;
      background: #A0A0A0;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }
    .card-content { margin-top: 14px; }
    .card-title { font-size: 13px; font-weight: 800; color: #151515; line-height: 1.25; margin-bottom: 4px; }
    .card-desc { font-size: 10.5px; color: #555555; line-height: 1.35; }

    .steps-section { padding: 30px 24px 20px 24px; text-align: right; }
    .steps-title { font-size: 20px; font-weight: 900; color: #FF7A00; margin-bottom: 16px; }
    .step-row { display: flex; align-items: flex-start; justify-content: flex-end; margin-bottom: 14px; gap: 12px; text-align: right; }
    .step-text { font-size: 13.5px; color: #222222; font-weight: 600; line-height: 1.4; padding-top: 4px; }
    .step-text strong { color: #111111; font-weight: 800; }
    .step-num { font-size: 36px; font-weight: 900; color: #FF7A00; line-height: 0.9; min-width: 44px; }

    .punchline-section { text-align: center; padding: 24px 20px 30px 20px; }
    .punchline-top { font-size: 20px; font-weight: 900; color: #111111; margin-bottom: 6px; }
    .punchline-bottom { font-size: 17px; font-weight: 800; color: #111111; }
    .punchline-bottom span { color: #FF7A00; font-weight: 900; }

    .footer-section { padding: 24px 24px 34px 24px; text-align: center; border-top: 1px solid #F3EDE4; }
    .footer-desc { font-size: 11.5px; color: #E08520; max-width: 360px; margin: 12px auto 18px auto; line-height: 1.45; }
    .social-btn { display: inline-block; width: 32px; height: 32px; background: #FFA226; color: #FFFFFF; border-radius: 50%; line-height: 32px; text-align: center; text-decoration: none; margin: 0 4px; font-weight: bold; font-size: 14px; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    
    <div style="text-align: center; padding: 32px 20px 20px 20px;">
      <a href="${dashboardUrl}" target="_blank">
        <img src="${logoUrl}" alt="OShift" width="130" style="display: inline-block; width: 130px; height: auto;" />
      </a>
    </div>

    <div class="hero-container">
      <div class="hero-box">
        <div class="hero-title-top">You’re in!</div>
        <div class="hero-title-bottom">Welcome to OShift!</div>
      </div>
      <img src="${mascotUrl}" alt="OShift Mascot" class="mascot-img" />
    </div>

    <div style="padding: 16px 24px 10px 24px;">
      <div style="font-size: 18px; font-weight: 900; color: #111111; margin-bottom: 6px;">
        Hi, <span style="color: #FF7A00;">${userName}</span>.
      </div>
      <div style="font-size: 15px; font-weight: 800; color: #1A1A1A; line-height: 1.4;">
        Nice to see you, you’ve successfully signed in to OShift.
      </div>
    </div>

    <div class="wave-section">
      <div style="font-size: 18px; font-weight: 900; color: #FF7A00; margin-bottom: 14px;">
        From here you can :
      </div>

      <div class="card-stream">
        <div class="pin-card card-1">
          <div class="pin-dot"></div>
          <div class="card-content">
            <div class="card-title">Track Competitors</div>
            <div class="card-desc">Crawl web, social, ads, and reviews 24/7.</div>
          </div>
        </div>

        <div class="pin-card card-2">
          <div class="pin-dot"></div>
          <div class="card-content">
            <div class="card-title">AI Strategy Insights</div>
            <div class="card-desc">Generate instant battlecards & SWOTs.</div>
          </div>
        </div>

        <div class="pin-card card-3">
          <div class="pin-dot" style="left: auto; right: 12px;"></div>
          <div class="card-content">
            <div class="card-title">Realtime Alerts</div>
            <div class="card-desc">Get weekly briefs and market shift alerts.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="steps-section">
      <div class="steps-title">: Start By</div>

      <div class="step-row">
        <div class="step-text">
          <strong>Add your first competitor</strong><br>
          Enter target websites to collect live signals.
        </div>
        <div class="step-num">.1</div>
      </div>

      <div class="step-row">
        <div class="step-text">
          <strong>Review market intelligence</strong><br>
          Explore pricing changes and social campaigns.
        </div>
        <div class="step-num">.2</div>
      </div>

      <div class="step-row">
        <div class="step-text">
          <strong>Launch Hermes AI assistant</strong><br>
          Uncover your competitive edge in minutes.
        </div>
        <div class="step-num">.3</div>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${dashboardUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #FF7A00 0%, #FF9000 100%); color: #FFFFFF; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 9999px; box-shadow: 0 6px 16px rgba(255, 122, 0, 0.35);">
          Launch Dashboard &rarr;
        </a>
      </div>
    </div>

    <div class="punchline-section">
      <div class="punchline-top">Just Like That!</div>
      <div class="punchline-bottom">
        From now on, You’re <span>Always One Step Ahead</span>
      </div>
    </div>

    <div class="footer-section">
      <a href="${dashboardUrl}" target="_blank">
        <img src="${logoUrl}" alt="OShift" width="115" style="display: inline-block; width: 115px; height: auto;" />
      </a>
      
      <p class="footer-desc">
        O·Shift is a platform that simplifies building, scaling, and managing competitive intelligence from start to finish, reducing operational workload while maintaining reliability.
      </p>

      <div style="margin-bottom: 16px;">
        <a href="${facebookUrl}" class="social-btn">f</a>
        <a href="${instagramUrl}" class="social-btn">&#9678;</a>
        <a href="${linkedinUrl}" class="social-btn">in</a>
      </div>

      <div style="font-size: 10.5px; color: #B3A89C;">
        &copy; ${year} OShift Inc. All rights reserved.
      </div>
    </div>

  </div>
</body>
</html>`;
}
