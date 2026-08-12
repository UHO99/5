CREATE TABLE coupon_issue (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  coupon_id BIGINT NOT NULL,
  status ENUM('ISSUED', 'USED', 'CANCELED', 'EXPIRED') NOT NULL DEFAULT 'ISSUED',
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,
  canceled_at TIMESTAMP NULL,
  expired_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_user_coupon UNIQUE (user_id, coupon_id),
  CONSTRAINT fk_coupon_issue_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_coupon_issue_coupon FOREIGN KEY (coupon_id) REFERENCES coupon (id)
) ENGINE=InnoDB;