-- Phase 5: Service Type Enhancements
-- Adds support for minimum attendees and scholarship discounts

-- 5.2 Gigi's 8-Week Program - minimum attendees requirement
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS minimum_attendees INTEGER DEFAULT NULL;
COMMENT ON COLUMN service_types.minimum_attendees IS 'Minimum number of attendees required for this service type (e.g., 8 for group programs)';

-- 5.3 Scholarship Group Discount
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS scholarship_discount_percentage DECIMAL(5,2) DEFAULT NULL;
COMMENT ON COLUMN service_types.scholarship_discount_percentage IS 'Percentage discount applied when client payment method is scholarship';
