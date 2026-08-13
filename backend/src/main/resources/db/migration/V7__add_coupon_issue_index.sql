CREATE INDEX idx_coupon_issue_coupon_status
    ON coupon_issue (coupon_id, status);