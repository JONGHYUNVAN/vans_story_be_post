const fs = require('fs');
const path = require('path');

// 깔끔한 Swagger UI HTML 템플릿 (헤더 제거, Try it out 기능 제거)
const cleanSwaggerHtmlTemplate = (swaggerSpec) => `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Posts API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin: 0;
            background: #fafafa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .swagger-ui .topbar {
            background-color: #2c3e50;
        }
        .swagger-ui .topbar .download-url-wrapper .select-label {
            color: #fff;
        }
        .swagger-ui .info .title {
            color: #2c3e50;
        }
        .swagger-ui .scheme-container {
            background-color: #f8f9fa;
            border-radius: 4px;
            padding: 10px;
        }
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
            background-color: #61affe;
        }
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
            background-color: #49cc90;
        }
        .swagger-ui .opblock.opblock-put .opblock-summary-method {
            background-color: #fca130;
        }
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
            background-color: #f93e3e;
        }
        .swagger-ui .opblock.opblock-patch .opblock-summary-method {
            background-color: #50e3c2;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
            border-top: 1px solid #eee;
            margin-top: 40px;
        }
        /* Try it out 버튼 숨기기 */
        .swagger-ui .try-out__btn {
            display: none !important;
        }
        .swagger-ui .execute-wrapper {
            display: none !important;
        }
        .swagger-ui .responses-wrapper {
            display: none !important;
        }
        .swagger-ui .opblock-summary-description {
            color: #666;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    
    <div class="footer">
        <p>Generated on ${new Date().toLocaleString('ko-KR')} | Powered by Swagger UI</p>
    </div>

    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                spec: ${JSON.stringify(swaggerSpec, null, 2)},
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                validatorUrl: null,
                supportedSubmitMethods: [], // 빈 배열로 설정하여 Try it out 비활성화
                docExpansion: 'list',
                filter: true,
                showRequestHeaders: false,
                showCommonExtensions: false,
                tryItOutEnabled: false, // Try it out 비활성화
                requestInterceptor: function(request) {
                    return request;
                },
                responseInterceptor: function(response) {
                    return response;
                }
            });
        };
    </script>
</body>
</html>
`;

// Swagger JSON 스펙을 읽어오는 함수
function readSwaggerSpec() {
    try {
        const specPath = path.join(__dirname, '..', 'swagger-spec.json');
        const specContent = fs.readFileSync(specPath, 'utf8');
        return JSON.parse(specContent);
    } catch (error) {
        console.error('Swagger spec 파일을 읽을 수 없습니다:', error.message);
        return null;
    }
}

// 깔끔한 Swagger HTML 파일 생성
function generateCleanSwaggerHtml() {
    const swaggerSpec = readSwaggerSpec();
    
    if (!swaggerSpec) {
        console.error('Swagger spec을 읽을 수 없어서 HTML을 생성할 수 없습니다.');
        return;
    }

    const htmlContent = cleanSwaggerHtmlTemplate(swaggerSpec);
    const outputDir = path.join(__dirname, '..', 'docs', 'swagger');
    const outputPath = path.join(outputDir, 'clean.html');

    // 출력 디렉토리 생성
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // HTML 파일 작성
    fs.writeFileSync(outputPath, htmlContent, 'utf8');
    console.log(`깔끔한 Swagger HTML 파일이 생성되었습니다: ${outputPath}`);
}

// 스크립트 실행
generateCleanSwaggerHtml(); 