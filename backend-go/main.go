// backend-go/checker/main.go
package main

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"time"
	// "github.com/domainr/whois" // 外部 WHOIS 庫，需要安裝
)

// 檢查結果結構
type CheckResult struct {
	URL            string `json:"url"`
	Status         string `json:"status"` // "OK" or "ERROR"
	HTTPStatus     int    `json:"http_status"`
	TLSDaysLeft    int    `json:"tls_days_left"`
	DomainDaysLeft int    `json:"domain_days_left"`
	ErrorDetails   string `json:"error_details"`
}

// CheckHTTP 執行 HTTP/HTTPS 連線檢查
func CheckHTTP(url string) CheckResult {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	resp, err := client.Get(url)
	if err != nil {
		// 檢查 TLS 錯誤
		if tlsErr, ok := err.(*tls.CertificateVerificationError); ok {
			return CheckResult{
				URL: url, Status: "ERROR", ErrorDetails: fmt.Sprintf("TLS/SSL 證書驗證失敗: %v", tlsErr),
			}
		}
		return CheckResult{
			URL: url, Status: "ERROR", ErrorDetails: fmt.Sprintf("HTTP/HTTPS 連線失敗: %v", err),
		}
	}
	defer resp.Body.Close()

	// 檢查 HTTP 狀態碼
	if resp.StatusCode < 400 {
		return CheckResult{
			URL: url, Status: "OK", HTTPStatus: resp.StatusCode,
		}
	}

	return CheckResult{
		URL: url, Status: "ERROR", HTTPStatus: resp.StatusCode, ErrorDetails: fmt.Sprintf("HTTP 狀態碼錯誤: %d", resp.StatusCode),
	}
}

// CheckTLS 檢查 HTTPS 證書的過期日
func CheckTLS(url string) int {
	// 假設 URL 是 "https://example.com"
	conn, err := tls.Dial("tcp", url+":443", &tls.Config{
		InsecureSkipVerify: true, // 允許我們檢查過期的證書
	})
	if err != nil {
		return -1 // 表示無法連線或非 HTTPS
	}
	defer conn.Close()

	// 取得伺服器證書鏈中的第一個證書
	certs := conn.ConnectionState().PeerCertificates
	if len(certs) == 0 {
		return 0 // 無證書
	}

	// 檢查證書過期日
	expiry := certs[0].NotAfter
	duration := time.Until(expiry)
	daysLeft := int(duration.Hours() / 24)

	return daysLeft
}

// CheckDomainExpiry 檢查域名過期日
// 警告：Go 標準庫不包含 WHOIS。此處僅為邏輯預留。
// 實際應用需引入第三方庫 (e.g., github.com/domainr/whois)
func CheckDomainExpiry(domain string) int {
	// 這裡需要 WHOIS 查詢邏輯
	// 由於 Go 標準庫不支援，這裡先返回一個模擬值
	// 實際操作中，WHOIS 查詢可能會被 Rate Limit，通常會緩存結果。
	fmt.Printf("⚠️ WHOIS 檢查邏輯需要第三方庫並實作。")
	return 90 // 假設剩餘 90 天
}

func main() {
	targetURL := "https://www.google.com"
	
	// 執行 HTTP 檢查
	httpResult := CheckHTTP(targetURL)
	fmt.Printf("--- HTTP/HTTPS 檢查 ---\n")
	fmt.Printf("結果: %s\n狀態碼: %d\n錯誤: %s\n", httpResult.Status, httpResult.HTTPStatus, httpResult.ErrorDetails)

	// 執行 TLS 檢查
	daysLeft := CheckTLS(targetURL)
	fmt.Printf("\n--- TLS 證書檢查 ---\n")
	if daysLeft == -1 {
		fmt.Printf("TLS 檢查失敗或非 HTTPS\n")
	} else {
		fmt.Printf("證書剩餘天數: %d 天\n", daysLeft)
	}

	// 執行域名過期檢查 (WHOIS)
	domain := "google.com" // 需要從 URL 中解析出域名
	domainDaysLeft := CheckDomainExpiry(domain)
	fmt.Printf("\n--- 域名過期檢查 ---\n")
	fmt.Printf("域名剩餘天數: %d 天\n", domainDaysLeft)
}