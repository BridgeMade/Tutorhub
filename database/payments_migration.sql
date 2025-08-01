-- Migration: Create payments table for manual payment tracking
-- This table supports the manual payment tracking system for TutorHub MVP

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('student_payment', 'tutor_payout')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'cash', 'check', 'paypal', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_number TEXT,
  description TEXT NOT NULL,
  session_ids UUID[],
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  payment_date DATE NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_payment_type ON payments(payment_type);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_recorded_by ON payments(recorded_by);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments table

-- Policy: Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can insert payments
CREATE POLICY "Admins can insert payments" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update payments
CREATE POLICY "Admins can update payments" ON payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete payments
CREATE POLICY "Admins can delete payments" ON payments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: Sample data insertion will be skipped if no profiles exist yet
-- Create sample data only if there are existing profiles with appropriate roles

DO $$
BEGIN
  -- Only insert sample data if we have profiles with different roles
  IF EXISTS (SELECT 1 FROM profiles WHERE role IN ('student', 'tutor', 'admin')) THEN
    
    -- Sample student payment (only if student and admin exist)
    IF EXISTS (SELECT 1 FROM profiles WHERE role = 'student') AND 
       EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') THEN
      INSERT INTO payments (
        user_id, 
        payment_type, 
        amount, 
        currency, 
        method, 
        status, 
        reference_number, 
        description, 
        recorded_by, 
        payment_date,
        notes
      ) VALUES (
        (SELECT id FROM profiles WHERE role = 'student' LIMIT 1),
        'student_payment',
        150.00,
        'USD',
        'bank_transfer',
        'completed',
        'TXN-2024-001',
        'Payment for 3 tutoring sessions - Mathematics',
        (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
        CURRENT_DATE - INTERVAL '2 days',
        'Received via bank transfer, verified by admin'
      );
    END IF;

    -- Sample tutor payout (only if tutor and admin exist)
    IF EXISTS (SELECT 1 FROM profiles WHERE role = 'tutor') AND 
       EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') THEN
      INSERT INTO payments (
        user_id, 
        payment_type, 
        amount, 
        currency, 
        method, 
        status, 
        reference_number, 
        description, 
        recorded_by, 
        payment_date,
        notes
      ) VALUES (
        (SELECT id FROM profiles WHERE role = 'tutor' LIMIT 1),
        'tutor_payout',
        120.00,
        'USD',
        'paypal',
        'completed',
        'PP-2024-001',
        'Weekly payout for completed sessions',
        (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
        CURRENT_DATE - INTERVAL '1 day',
        'Paid via PayPal, tutor confirmed receipt'
      );
    END IF;

  END IF;
END $$;