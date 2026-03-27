// 하드코딩된 페이지 컨텐츠
export const PAGE_CONTENTS: Record<string, string> = {
  "/connect/greeting": `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>담임목사 인사말</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Noto Sans KR', 'Poppins', sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
            scroll-behavior: smooth;
        }

        .header {
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            padding: 64px 0;
            text-align: center;
        }

        @media (min-width: 768px) {
            .header {
                padding: 96px 0;
            }
        }

        .header h1 {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 16px;
            color: #0f172a;
            letter-spacing: -0.025em;
        }

        @media (min-width: 768px) {
            .header h1 {
                font-size: 48px;
            }
        }

        .header p {
            font-size: 18px;
            font-weight: 500;
            color: #0369a1;
        }

        .main-content {
            padding: 64px 16px;
        }

        .content-box {
            max-width: 896px;
            margin: 0 auto;
            background-color: #fff;
            padding: 32px;
            border-radius: 16px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }

        @media (min-width: 768px) {
            .content-box {
                padding: 48px;
            }
        }

        .content-box p {
            font-size: 18px;
            color: #334155;
            line-height: 1.6;
            margin-bottom: 24px;
        }

        .content-box strong {
            font-weight: 600;
            color: #0369a1;
        }

        .quote {
            border-left: 4px solid #7dd3fc;
            padding: 16px 24px;
            margin: 32px 0;
            background-color: #f0f9ff;
            border-radius: 0 8px 8px 0;
        }

        .quote p {
            font-size: 20px;
            font-style: italic;
            color: #075985;
            font-weight: 500;
            margin-bottom: 4px;
        }

        .quote .author {
            font-size: 16px;
            color: #0284c7;
            margin-top: 4px;
        }

        .signature {
            margin-top: 48px;
            padding-top: 32px;
            border-top: 1px solid #e2e8f0;
            text-align: right;
        }

        .signature .name {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
        }

        .signature .role {
            font-size: 16px;
            color: #475569;
        }

        .fade-in {
            animation: fadeIn 1s ease-out forwards;
            opacity: 0;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>

<body>

    <header class="header fade-in">
        <div class="container mx-auto px-4">
            <h1>담임목사 인사말</h1>
            <p>교회의 부르심과 사명에 대하여</p>
        </div>
    </header>

    <main class="main-content">
        <div class="content-box fade-in" style="animation-delay: 0.2s;">
            <p>
                교회는 하나님께서 이 땅에 주신 고귀한 선물이며, 이 땅에 소망입니다. 이 땅의 많은 교회들이 비록 하나님이 진정으로 원하시는 교회의 목적과 사명을 잃고 표류하고 있다 하더라도, 교회는 여전히 이 세상에서 하나님 나라를 완성해 나가기 위해 주님께서 사용하시는 <strong class="font-semibold text-primary-700">"유일한 기관"</strong>입니다.
            </p>
            <p>
                따라서 교회는 세상으로부터 부름을 받아 하나님께서 약속하신 축복으로 인한 특권을 누림과 동시에 사명과 의무가 있습니다. 그것은 세상으로 보냄을 받아 하나님의 뜻을 우리가 속해 있는 가정, 학교, 직장, 사회와 이 땅 가운데 실현하는 능동적이며 역동적인 <strong class="font-semibold text-primary-700">선교적 삶</strong>을 사는 것입니다.
            </p>
            <p>
                하나님께서 토론토 커넥트 교회를 다운타운에 세우시고 이 특권과 사명을 동시에 누리는 축복과 기쁨을 허락하셨습니다.
            </p>
            <p>
                이 일을 위해 <strong class="font-semibold text-primary-700">하나님과의 회복과 소통</strong>에 우선 순위를 두게 됩니다. 인류의 불행과 저주는 하나님과의 불통으로 생긴 것입니다. 존 파이퍼 목사님이 그의 책 "열방이 기뻐하게 하라"(Let the nations be glad)라는 책에 이런 말이 써 있습니다.
            </p>

            <blockquote class="quote">
                <p>"예배가 존재하지 않기 때문에 선교가 존재한다"</p>
                <p class="author">(Mission exists because worship doesn't)</p>
            </blockquote>

            <p>
                선교의 궁극적인 목적은 예배가 없는 곳에 예배를 있게 하는 것입니다. 하나님과 소통이 없는 곳에 하나님과 소통이 이루어지게 하는 것입니다. 이것이 이 세상에서 가장 고귀하고 가치 있는 삶인 것입니다.
            </p>
            <p>
                하나님과의 소통이 이루어지면 <strong class="font-semibold text-primary-700">사람과의 소통</strong>이 이루어집니다. 공부해서 남주고 돈 벌어서 남주고 신앙생활해서 남주는 것입니다. 300명을 먹이고, 5000명을 먹이는 것입니다. 돌봄과 섬김의 삶이 교회 안에 이루어지게 됩니다.
            </p>
            <p>
                이렇게 되면 자연스럽게 <strong class="font-semibold text-primary-700">이웃과의 소통</strong> 그리고 <strong class="font-semibold text-primary-700">세상과의 소통</strong>이 이루어질 것입니다. 이것이 단계별로 이루어지기보다는 마태복음 22장의 하나님 사랑 이웃 사랑은 '<strong class="font-semibold text-primary-700">AND</strong>'라는 접속사로 연결이 되어 있습니다. 둘 다 똑같다는 것입니다. 우선 순위에 문제인 것입니다. 하나님 사랑과 이웃 사랑은 동일한 것입니다. 그래서 요한은 '<em class="text-secondary-600">누구든지 하나님을 사랑하노라 하고 그 형제를 미워하면 이는 거짓말하는 자니</em>'라고 강조하고 있는 것입니다.
            </p>
            <p>
                이 고귀한 하나님의 부르심과 축복에 여러분과 함께할 수 있어 기쁘고 감사합니다. 앞으로 이 교회를 통해 순종하는 이들과 이루실 하나님의 놀라운 역사를 기대하며 기도하며 기다립시다.
            </p>

            <div class="signature">
                <p class="name">김지연</p>
                <p class="role">토론토 커넥트 교회 담임목사</p>
            </div>
        </div>
    </main>

</body>
</html>`,
  "/connect/about": `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>토론토 커넥트 교회</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
        }

        body {
            font-family: 'Noto Sans KR', sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            //padding: 0 20px;
        }

        /* Header */
        .header {
            background: linear-gradient(135deg, #e0f2fe, #bae6fd);
            padding: 80px 0;
            text-align: center;
        }

        .header h1 {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #0c4a6e;
        }

        .header .subtitle {
            font-size: 20px;
            color: #0369a1;
            font-weight: 400;
        }

        /* Section Title */
        .section-title {
            text-align: center;
            font-size: 32px;
            font-weight: 700;
            margin: 60px 0 40px;
            color: #0f172a;
            position: relative;
        }

        .section-title::after {
            content: '';
            display: block;
            width: 60px;
            height: 4px;
            background-color: #0ea5e9;
            margin: 20px auto 0;
            border-radius: 2px;
        }

        /* Content Box */
        .content-box {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            margin-bottom: 30px;
        }

        /* Scripture Box */
        .scripture-box {
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            padding: 40px;
            border-radius: 12px;
            margin: 40px 0;
            border-left: 4px solid #0ea5e9;
        }

        .scripture-text {
            font-size: 22px;
            font-weight: 500;
            color: #0c4a6e;
            line-height: 1.8;
            margin-bottom: 15px;
        }

        .scripture-ref {
            color: #64748b;
            font-size: 16px;
            margin-bottom: 10px;
        }

        .scripture-english {
            font-style: italic;
            color: #475569;
            font-size: 18px;
            line-height: 1.6;
        }

        /* Info Cards */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin: 40px 0;
        }

        .info-card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            text-align: center;
            transition: transform 0.3s;
        }

        .info-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
        }

        .info-card h3 {
            font-size: 24px;
            color: #0f172a;
            margin-bottom: 15px;
        }

        .info-card .highlight {
            color: #0ea5e9;
            font-weight: 600;
            font-size: 20px;
        }

        .info-card .english {
            color: #64748b;
            font-style: italic;
            margin-top: 5px;
        }

        /* Vision Section */
        .vision-container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            margin: 40px 0;
        }

        .vision-item {
            display: flex;
            align-items: center;
            border-bottom: 1px solid #e2e8f0;
        }

        .vision-item:last-child {
            border-bottom: none;
        }

        .vision-header {
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            color: white;
            padding: 40px;
            width: 35%;
            min-height: 150px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .vision-item:nth-child(2) .vision-header {
            background: linear-gradient(135deg, #0284c7, #0369a1);
        }

        .vision-item:nth-child(3) .vision-header {
            background: linear-gradient(135deg, #0369a1, #075985);
        }

        .vision-header h3 {
            font-size: 24px;
            margin-bottom: 8px;
        }

        .vision-header .subtitle {
            opacity: 0.9;
            font-size: 16px;
        }

        .vision-content {
            padding: 40px;
            width: 65%;
        }

        .vision-content p {
            color: #475569;
            line-height: 1.8;
            font-size: 17px;
        }

        /* Goal Section */
        .goal-box {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            margin-bottom: 30px;
        }

        .goal-header {
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            color: white;
            padding: 25px 30px;
            font-size: 24px;
            font-weight: 600;
        }

        .goal-box:nth-child(2) .goal-header {
            background: linear-gradient(135deg, #0284c7, #0369a1);
        }

        .goal-box:nth-child(3) .goal-header {
            background: linear-gradient(135deg, #0369a1, #075985);
        }

        .goal-content {
            padding: 30px;
        }

        .goal-item {
            margin-bottom: 30px;
            padding-bottom: 30px;
            border-bottom: 1px solid #e2e8f0;
        }

        .goal-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }

        .goal-item h4 {
            color: #0ea5e9;
            font-size: 20px;
            margin-bottom: 15px;
            font-weight: 600;
        }

        .goal-item p {
            color: #475569;
            line-height: 1.8;
            font-size: 16px;
        }

        /* CTA Section */
        .cta-section {
            background: linear-gradient(135deg, #e0f2fe, #bae6fd);
            padding: 60px 40px;
            border-radius: 12px;
            text-align: center;
            margin: 60px 0;
        }

        .cta-section h2 {
            font-size: 28px;
            color: #0c4a6e;
            margin-bottom: 15px;
        }

        .cta-section p {
            font-size: 18px;
            color: #0369a1;
            margin-bottom: 30px;
        }

        .button-group {
            display: flex;
            gap: 20px;
            justify-content: center;
        }

        .btn {
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.3s;
            display: inline-block;
        }

        .btn-primary {
            background: #0ea5e9;
            color: white;
        }

        .btn-primary:hover {
            background: #0284c7;
            transform: translateY(-2px);
        }

        .btn-secondary {
            background: white;
            color: #0ea5e9;
            border: 2px solid #0ea5e9;
        }

        .btn-secondary:hover {
            background: #f0f9ff;
            transform: translateY(-2px);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .header h1 {
                font-size: 36px;
            }

            .vision-item {
                flex-direction: column;
            }

            .vision-header,
            .vision-content {
                width: 100%;
            }

            .button-group {
                flex-direction: column;
            }

            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <h1>토론토 커넥트 교회</h1>
            <p class="subtitle">하나님과 이웃을 연결하며 사랑을 실천하는 믿음의 공동체</p>
        </div>
    </header>

    <!-- Main Content -->
    <div class="container">
        <!-- Scripture Section -->
        <section>
            <h2 class="section-title">교회 설립 성구</h2>
            <div class="scripture-box">
                <p class="scripture-text">
                    예수께서 이르시되 네 마음을 다하고 목숨을 다하고 뜻을 다하여 주 너의 하나님을 사랑하라 하셨으니 이것이 크고 첫째 되는 계명이요 둘째도 그와 같으니 네 이웃을 네 자신 같이 사랑하라 하셨으니 이 두 계명이 온 율법과 선지자의 강령이니라
                </p>
                <p class="scripture-ref">(마태복음 22:37-40; 마가복음 12:28-31)</p>
                <p class="scripture-english">
                    Jesus replied: "'Love the Lord your God with all your heart and with all your soul and with all your mind.' This is the first and greatest commandment. And the second is like it: 'Love your neighbor as yourself.'"
                </p>
            </div>
        </section>

        <!-- Info Cards -->
        <section>
            <div class="info-grid">
                <div class="info-card">
                    <h3>교회 설립 표어</h3>
                    <p class="highlight">하나님 사랑 이웃 사랑</p>
                    <p class="english">Love your God, Love your Neighbor</p>
                </div>
                <div class="info-card">
                    <h3>교회 설립 슬로건</h3>
                    <p style="color: #475569; margin-top: 10px;">
                        • Connect with God<br>
                        • Connect with You and Me<br>
                        • Connect with People and the World
                    </p>
                </div>
            </div>
        </section>

        <!-- Vision Section -->
        <section>
            <h2 class="section-title">목회 비전</h2>
            <div class="vision-container">
                <div class="vision-item">
                    <div class="vision-header">
                        <h3>Connect with God</h3>
                        <p class="subtitle">(하나님 사랑)</p>
                    </div>
                    <div class="vision-content">
                        <p>
                            하나님이 받으시는 예배, 말씀과 기도로 하나님과의 친밀한 관계로 나아가며, 양육하고 훈련하여 제자의 삶으로 나아가는 믿음 공동체.
                        </p>
                    </div>
                </div>
                <div class="vision-item">
                    <div class="vision-header">
                        <h3>Connect with You</h3>
                        <p class="subtitle">(가족 사랑)</p>
                    </div>
                    <div class="vision-content">
                        <p>
                            예수 그리스도 안에서 가족이 된 공동체로써 함께 교제와 섬김, 돌봄과 나눔을 통해 개인의 회복과 가정의 회복, 그리고 건강하고 생산적인 교회를 만들어 가는 더 나아가 다음 세대를 세워가는 사랑 공동체
                        </p>
                    </div>
                </div>
                <div class="vision-item">
                    <div class="vision-header">
                        <h3>Connect with People</h3>
                        <p class="subtitle">(이웃 사랑)</p>
                    </div>
                    <div class="vision-content">
                        <p>
                            우리가 살고 있는 도시와 이웃 그리고 열방을 섬기기 위해 뿌리고, 모으고, 흩고 파송하는 사명 공동체
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Goals Section -->
        <section>
            <h2 class="section-title">목회 목표</h2>

            <div class="goal-box">
                <div class="goal-header">1. 믿음 공동체</div>
                <div class="goal-content">
                    <div class="goal-item">
                        <h4>하나님이 받으시는 예배</h4>
                        <p>
                            예배의 중심도 대상도 목적도 하나님이십니다. 성도가 예배를 통해 하나님을 만나며, 하나님의 생명력을 접촉하는 시간입니다. 예배를 통해 죄 사함이 이루어지고, 무거운 짐들을 내려놓고 상한 영혼이 회복되고, 하나님을 만남으로 새로워지며 강한 용사가 되어 담대하게 세상으로 나가는 것을 목표로 삼고 있습니다.
                        </p>
                    </div>
                    <div class="goal-item">
                        <h4>양육과 훈련으로 성장하고 성숙하는 제자</h4>
                        <p>
                            깊이 있고 체계적인 양육 과정을 통해 성장과 변화 그리고 성숙의 기쁨이 있는 교회를 지향하며, 하나님의 말씀과 복음 및 성서적인 삶을 구체적으로 제시하고 배워 성령 안에서 예수님을 닮은 성숙한 제자의 삶을 살도록 돕는 교회입니다.
                        </p>
                    </div>
                </div>
            </div>

            <div class="goal-box">
                <div class="goal-header">2. 사랑 공동체</div>
                <div class="goal-content">
                    <div class="goal-item">
                        <h4>소그룹 중심의 사랑 공동체</h4>
                        <p>
                            소그룹 중심의 서로를 향해 열려있어 사람을 행복하게 하는 사랑 공동체로써 초대교회와 같은 삶의 나눔과 위로가 있는, 건강한 소그룹 중심의 교회입니다. 하나님이 세상을 창조하시고 인간에게 주신 가장 고귀한 선물은 가정입니다. 토론토 커넥트 교회는 가정이 먼저 회복됨으로 교회도 건강해진다는 믿음으로 상한 가정을 회복시키고 건강한 가정을 더욱 견고히 세우는 교회를 지향합니다.
                        </p>
                    </div>
                    <div class="goal-item">
                        <h4>다음세대를 세우는 교회</h4>
                        <p>
                            어린이와 청소년 그리고 청년들에게 그리스도의 사랑으로 치유하고 회복시키며, 생존과 이기적 성공의 거짓된 꿈을 버리고 하나님의 말씀을 통해 자신의 목적을 발견하고 사명과 비전을 따라 살아가는 자들로 세워 올바른 가치관을 가진 다음 세대의 지도자들을 꿈꾸게 하고 양성하는 일에 최선을 다하는 교회입니다.
                        </p>
                    </div>
                    <div class="goal-item">
                        <h4>은사와 열정에 따라 섬기는 교회</h4>
                        <p>
                            하나님이 주신 은사와 열정에 따라 교회와 사회를 섬기는 것을 축복이라 고백하는, 서로의 은사를 존중하는 교회입니다.
                        </p>
                    </div>
                </div>
            </div>

            <div class="goal-box">
                <div class="goal-header">3. 사명 공동체</div>
                <div class="goal-content">
                    <div class="goal-item">
                        <h4>이웃 사랑</h4>
                        <p>
                            이웃사랑의 최선은 복음을 증거하는 것입니다. Fellowship, Friendship and Relationship을 통해 믿지 않는 영혼들을 전도하는 일에 우선을 두게 됩니다. 다운타운 지역의 노숙자나 빈민과 긍휼사역 그리고 시니어 사역 등의 나눔과 돌봄사역을 하게 됩니다. 문화 사역을 통해 지역에 그리스도의 문화를 보급하고 복음 안에서 복음으로 이웃사랑을 실천하는 교회입니다.
                        </p>
                    </div>
                    <div class="goal-item">
                        <h4>열방 사랑</h4>
                        <p>
                            민족과 열방을 향해 기도하며 나아가는 교회로 세상을 향한 소금으로서의 책임을 다하는 교회입니다. 이 땅과 열방을 향해 하나님의 복음을 통해 끊임없이 변화를 추구하는 교회입니다.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section">
            <h2>함께 하나님을 예배하고 이웃을 사랑해요</h2>
            <p>토론토 커넥트 교회와 함께 하나님과 이웃을 연결하는 여정에 동참하세요.</p>
            <div class="button-group">
                <a href="#" class="btn btn-primary">예배 참석하기</a>
                <a href="#" class="btn btn-secondary">더 알아보기</a>
            </div>
        </section>
    </div>
</body>
</html>`,
  "/connect/church-info": `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>예배 및 위치 안내 - 토론토 커넥트 교회</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Noto Sans KR', sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
        }

        /* Header */
        .header {
            background: linear-gradient(135deg, #e0f2fe, #bae6fd);
            padding: 80px 0;
            text-align: center;
        }

        .header h1 {
            font-size: 42px;
            font-weight: 700;
            margin-bottom: 15px;
            color: #0c4a6e;
        }

        .header p {
            font-size: 18px;
            color: #0369a1;
            font-weight: 500;
        }

        /* Info Cards */
        .info-card {
            background: white;
            padding: 35px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            margin-bottom: 25px;
        }

        .info-card h3 {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            padding-bottom: 15px;
            border-bottom: 2px solid #e2e8f0;
        }

        .info-card h4 {
            font-size: 18px;
            font-weight: 600;
            color: #0369a1;
            margin-bottom: 12px;
            margin-top: 20px;
        }

        .info-card h4:first-child {
            margin-top: 0;
        }

        /* List Styles */
        .info-list {
            list-style: none;
            margin: 15px 0;
        }

        .info-list li {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            color: #334155;
        }

        .info-list strong {
            font-weight: 600;
            color: #1e293b;
        }

        .location-tag {
            display: inline-block;
            font-size: 14px;
            color: #64748b;
            margin-top: 3px;
        }

        /* Description Text */
        .description {
            color: #475569;
            line-height: 1.8;
            margin-top: 15px;
        }

        /* Section Divider */
        .section-divider {
            padding-bottom: 20px;
            margin-bottom: 20px;
            border-bottom: 1px solid #e2e8f0;
        }

        .section-divider:last-child {
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
        }

        /* Highlight Box */
        .highlight-box {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            display: flex;
            align-items: center;
        }

        .highlight-box p {
            color: #0369a1;
            font-size: 14px;
        }

        /* Link Style */
        .map-link {
            display: inline-block;
            margin-top: 10px;
            color: #0ea5e9;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s;
        }

        .map-link:hover {
            color: #0284c7;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .header h1 {
                font-size: 32px;
            }

            .info-card {
                padding: 25px;
            }

            .info-card h3 {
                font-size: 20px;
            }
        }
    </style>
</head>

<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <h1>예배 및 위치 안내</h1>
            <p>Worship with All Generations</p>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container" style="padding: 50px 20px;">

        <!-- Sunday Worship -->
        <div class="info-card">
            <h3>주일 모임 안내</h3>
            <ul class="info-list">
                <li>
                    <div>
                        <strong>Sunday Worship Service:</strong> 주일 오후 3:00<br>
                        <span class="location-tag">@ 별관 Gym</span>
                    </div>
                </li>
                <li>
                    <div>
                        <strong>셀모임 (Kids/Youth/청년/장년):</strong> 주일 오후 5:00<br>
                        <span class="location-tag">@ 별관 Gym</span>
                    </div>
                </li>
            </ul>
        </div>

        <!-- Weekday Gatherings -->
        <div class="info-card">
            <h3>주중 모임 안내</h3>

            <div class="section-divider">
                <h4>Worship Team</h4>
                <ul class="info-list">
                    <li>
                        <div><strong>수요일 저녁 8:00</strong> @ 목사관</div>
                    </li>
                </ul>
            </div>

            <div>
                <h4>Bible Connect IN (BC IN 모임)</h4>
                <ul class="info-list">
                    <li>
                        <div><strong>화요일 저녁 7:00</strong> @ 목사관</div>
                    </li>
                    <li>
                        <div><strong>목요일 저녁 5:00</strong> @ Toronto Public Library</div>
                    </li>
                </ul>
                <p class="description">
                    2년에 일독하는 통독일정에 따라 당일 말씀을 읽고 하나님이 누구신지, 나에게 와닿은 말씀이 무엇인지, 오늘 내가 적용할 말씀을 생각하고 나누며 말씀이 주인이 되는 삶을 살기 위한 모임입니다. 총 일주일에 두 번 진행하며 원하시는 날짜에 참여하시면 됩니다.
                </p>
            </div>
        </div>

        <!-- Leadership Training -->
        <div class="info-card">
            <h3>리더십 훈련 (CLT 미팅)</h3>
            <p class="description">
                CLT는 Christian Life TEE의 약자로, TEE는 Theological Education by Extension의 약자입니다. 예수님의 마지막 지상명령은 제자가 제자를 만드는 것으로, CLT는 개인의 영성과 공동체의 영성을 성장과 하나됨에 초점을 둔 훈련입니다.
            </p>
            <p class="description">
                2025년은 총 3과목 (풍성한 생명, 신앙의 토대, 잠언)입니다. 2025년 CLT 시간 안내는 다음과 같습니다.
            </p>
            <ul class="info-list">
                <li>
                    <div><strong>풍성한 생명:</strong> 화요일 저녁 7:00 & 금요일 저녁 7:00</div>
                </li>
                <li>
                    <div><strong>신앙의 토대:</strong> 화요일 저녁 9:00 @ 목사관</div>
                </li>
                <li>
                    <div><strong>잠언:</strong> 금요일 저녁 8:30 @ 목사관</div>
                </li>
            </ul>
        </div>

        <!-- Thursday Adoration -->
        <div class="info-card">
            <h3>목요 Adoration 집회</h3>
            <ul class="info-list">
                <li>
                    <div><strong>목요일 저녁 7:15</strong> @ 별관 예배실</div>
                </li>
            </ul>
            <p class="description">
                Connect with God / 찬양과 말씀으로 하나님과 소통하고<br>
                Connect with You / 기도와 중보로 서로 세우며<br>
                Connect with People / 이 땅과 조국과 열방을 위해<br>
                중보하는 2시간 찬양과 말씀 그리고 기도로 커넥트되는 시간에 함께하기를 기대하며 기도합니다.
            </p>
        </div>

        <!-- Location & Directions -->
        <div class="info-card">
            <h3>교회 위치 및 오시는 길</h3>

            <div class="section-divider">
                <h4>교회 주소</h4>
                <p style="font-size: 18px; font-weight: 500; color: #1e293b; margin-bottom: 5px;">Stone Church</p>
                <p>45 Davenport Road<br>Toronto, ON M5R 1H2</p>
                <a href="https://www.google.com/maps/place/45+Davenport+Rd,+Toronto,+ON+M5R+1H2" target="_blank" rel="noopener noreferrer" class="map-link">
                    구글 지도로 보기 →
                </a>
            </div>

            <div class="section-divider">
                <h4>오시는 길 (Direction)</h4>
                <p class="description">
                    One block north of Yonge and Bloor subway station and Bay subway stations.<br>
                    Yonge and Bloor 전철역 또는 Bay 전철역에서 한 블록 북쪽으로 오시면 Davenport를 만나 45번지를 찾으시면 됩니다.
                </p>
            </div>

            <div>
                <h4>주차 안내 (Free Underground Parking)</h4>
                <p class="description">
                    Available for almost all events, enter off Scollard Street. Just push the green button on the control panel.<br>
                    40 Scollard St. 아파트 지하 주차장 입구 패널의 녹색 버튼을 누르시면 됩니다.
                </p>
                <div class="highlight-box">
                    <p>주차장 입구는 건물 뒤 <strong>Scollard Street</strong>에 있습니다.</p>
                </div>
            </div>
        </div>

        <!-- Contact Info -->
        <div class="info-card">
            <h3>연락처 / 목사관</h3>
            <ul class="info-list">
                <li>
                    <div>
                        <strong>Mailing Address:</strong><br>
                        45 Kentland Crescent, North York, ON M2M 2X7
                    </div>
                </li>
                <li>
                    <div><strong>전화:</strong> 905-707-9498 & 647-447-9776</div>
                </li>
                <li>
                    <div><strong>이메일:</strong> tconnectchurch@gmail.com</div>
                </li>
                <li>
                    <div><strong>카카오톡:</strong> isctoronto</div>
                </li>
            </ul>
        </div>

    </main>
</body>
</html>`,
};
