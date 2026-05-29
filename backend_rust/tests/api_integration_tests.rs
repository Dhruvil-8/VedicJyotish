use std::process::{Child, Command};
use std::time::Duration;
use serde_json::json;

struct TestServer {
    child: Child,
    _port: u16,
}

impl TestServer {
    async fn start(port: u16) -> Self {
        // Start the server using cargo run
        let child = Command::new("cargo")
            .args(&["run", "--bin", "backend_rust"])
            .env("PORT", port.to_string())
            .env("ENVIRONMENT", "development")
            .env("REQUIRE_API_KEY", "false") // Disable auth during tests
            .spawn()
            .expect("Failed to spawn cargo run for integration tests");

        let this = TestServer { child, _port: port };

        // Wait-for-it loop: poll the health endpoint until it responds
        let client = reqwest::Client::new();
        let mut started = false;
        for _ in 0..40 { // Wait up to 10 seconds total
            if let Ok(resp) = client.get(format!("http://127.0.0.1:{}", port)).send().await {
                if resp.status().is_success() {
                    started = true;
                    break;
                }
            }
            tokio::time::sleep(Duration::from_millis(250)).await;
        }

        if !started {
            panic!("Integration test server failed to start or bind within 10 seconds.");
        }

        this
    }
}

impl Drop for TestServer {
    fn drop(&mut self) {
        // Terminate the background server process cleanly
        let _ = self.child.kill();
    }
}

#[tokio::test]
async fn test_api_health_check() {
    let port = 7869;
    let _server = TestServer::start(port).await;

    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}", port);

    let resp = client.get(&url)
        .send()
        .await
        .expect("Failed to send request to health check");

    assert_eq!(resp.status(), reqwest::StatusCode::OK);
    
    let json: serde_json::Value = resp.json()
        .await
        .expect("Failed to parse health check JSON response");

    assert_eq!(json["status"], "online");
    assert_eq!(json["engine"], "rust-swiss-eph");
}

#[tokio::test]
async fn test_api_capabilities() {
    let port = 7870;
    let _server = TestServer::start(port).await;

    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}/api/v1/capabilities", port);

    let resp = client.get(&url)
        .send()
        .await
        .expect("Failed to send request to capabilities endpoint");

    assert_eq!(resp.status(), reqwest::StatusCode::OK);
    
    let json: serde_json::Value = resp.json()
        .await
        .expect("Failed to parse capabilities JSON response");

    // Verify presence of calculations/methods in response metadata
    assert!(json["implemented"].is_array());
    assert!(json["security"].is_array());
}

#[tokio::test]
async fn test_api_chart_calculation() {
    let port = 7871;
    let _server = TestServer::start(port).await;

    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}/calculate_chart", port);

    // Mumbai natal details for Sri Rama (approximate classic parameters)
    let payload = json!({
        "date": "28/05/1998",
        "time": "12:30",
        "city": "Mumbai",
        "lat": 19.076,
        "lon": 72.877,
        "timezone": 5.5
    });

    let resp = client.post(&url)
        .json(&payload)
        .send()
        .await
        .expect("Failed to send POST request to calculate_chart");

    assert_eq!(resp.status(), reqwest::StatusCode::OK);

    let json: serde_json::Value = resp.json()
        .await
        .expect("Failed to parse chart calculation JSON response");

    // Verify key fields in birth chart calculation matches ChartResponse structure
    assert!(json["ascendant"].is_object());
    assert!(json["chart_data"].is_object());
    assert!(json["planetary_table"].is_array());
    assert!(json["vimshottari_timeline"].is_array());
    assert!(json["yogas"].is_array());
}
