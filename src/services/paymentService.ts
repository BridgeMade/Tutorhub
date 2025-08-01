import { supabase } from '../lib/supabase';

export interface Payment {
  id: string;
  user_id: string;
  payment_type: 'student_payment' | 'tutor_payout';
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'cash' | 'check' | 'paypal' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference_number?: string;
  description: string;
  session_ids?: string[]; // Related session IDs
  recorded_by: string; // Admin user who recorded this payment
  payment_date: string;
  recorded_at: string;
  notes?: string;
}

export interface PaymentSummary {
  totalStudentPayments: number;
  totalTutorPayouts: number;
  pendingPayments: number;
  pendingPayouts: number;
  monthlyRevenue: number;
  monthlyPayouts: number;
}

export const paymentService = {
  // Record a manual student payment
  async recordStudentPayment(paymentData: Partial<Payment>): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...paymentData,
        payment_type: 'student_payment',
        recorded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording student payment:', error);
      return null;
    }

    return data;
  },

  // Record a manual tutor payout
  async recordTutorPayout(paymentData: Partial<Payment>): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...paymentData,
        payment_type: 'tutor_payout',
        recorded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording tutor payout:', error);
      return null;
    }

    return data;
  },

  // Get payments for a specific user
  async getUserPayments(userId: string, paymentType?: 'student_payment' | 'tutor_payout'): Promise<Payment[]> {
    let query = supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('payment_date', { ascending: false });

    if (paymentType) {
      query = query.eq('payment_type', paymentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user payments:', error);
      return [];
    }

    return data || [];
  },

  // Get all payments (admin view)
  async getAllPayments(filters?: {
    paymentType?: 'student_payment' | 'tutor_payout';
    status?: Payment['status'];
    method?: Payment['method'];
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Payment[]> {
    let query = supabase
      .from('payments')
      .select(`
        *,
        user:profiles!user_id(id, full_name, email)
      `)
      .order('payment_date', { ascending: false });

    if (filters?.paymentType) {
      query = query.eq('payment_type', filters.paymentType);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.method) {
      query = query.eq('method', filters.method);
    }

    if (filters?.dateFrom) {
      query = query.gte('payment_date', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('payment_date', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all payments:', error);
      return [];
    }

    return data || [];
  },

  // Update payment status
  async updatePaymentStatus(paymentId: string, status: Payment['status'], notes?: string): Promise<Payment | null> {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment status:', error);
      return null;
    }

    return data;
  },

  // Get payment summary for dashboard
  async getPaymentSummary(dateFrom?: string, dateTo?: string): Promise<PaymentSummary> {
    let query = supabase
      .from('payments')
      .select('*');

    if (dateFrom) {
      query = query.gte('payment_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('payment_date', dateTo);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('Error fetching payment summary:', error);
      return {
        totalStudentPayments: 0,
        totalTutorPayouts: 0,
        pendingPayments: 0,
        pendingPayouts: 0,
        monthlyRevenue: 0,
        monthlyPayouts: 0
      };
    }

    const studentPayments = data.filter((p: Payment) => p.payment_type === 'student_payment');
    const tutorPayouts = data.filter((p: Payment) => p.payment_type === 'tutor_payout');

    // Current month calculations
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthlyData = data.filter((p: Payment) => new Date(p.payment_date) >= monthStart);
    const monthlyStudentPayments = monthlyData.filter((p: Payment) => p.payment_type === 'student_payment');
    const monthlyTutorPayouts = monthlyData.filter((p: Payment) => p.payment_type === 'tutor_payout');

    return {
      totalStudentPayments: studentPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0),
      totalTutorPayouts: tutorPayouts.reduce((sum: number, p: Payment) => sum + p.amount, 0),
      pendingPayments: studentPayments.filter((p: Payment) => p.status === 'pending').reduce((sum: number, p: Payment) => sum + p.amount, 0),
      pendingPayouts: tutorPayouts.filter((p: Payment) => p.status === 'pending').reduce((sum: number, p: Payment) => sum + p.amount, 0),
      monthlyRevenue: monthlyStudentPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0),
      monthlyPayouts: monthlyTutorPayouts.reduce((sum: number, p: Payment) => sum + p.amount, 0)
    };
  },

  // Delete payment (admin only)
  async deletePayment(paymentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      console.error('Error deleting payment:', error);
      return false;
    }

    return true;
  },

  // Get tutor earnings for a specific tutor
  async getTutorEarnings(tutorId: string, dateFrom?: string, dateTo?: string): Promise<{
    totalEarnings: number;
    pendingPayouts: number;
    completedPayouts: number;
    paymentHistory: Payment[];
  }> {
    const payments = await this.getUserPayments(tutorId, 'tutor_payout');
    
    let filteredPayments = payments;
    
    if (dateFrom) {
      filteredPayments = filteredPayments.filter(p => p.payment_date >= dateFrom);
    }
    
    if (dateTo) {
      filteredPayments = filteredPayments.filter(p => p.payment_date <= dateTo);
    }

    const completedPayouts = filteredPayments.filter(p => p.status === 'completed');
    const pendingPayouts = filteredPayments.filter(p => p.status === 'pending');

    return {
      totalEarnings: completedPayouts.reduce((sum, p) => sum + p.amount, 0),
      pendingPayouts: pendingPayouts.reduce((sum, p) => sum + p.amount, 0),
      completedPayouts: completedPayouts.reduce((sum, p) => sum + p.amount, 0),
      paymentHistory: filteredPayments
    };
  },

  // Get student payment history
  async getStudentPaymentHistory(studentId: string, dateFrom?: string, dateTo?: string): Promise<{
    totalPaid: number;
    pendingPayments: number;
    paymentHistory: Payment[];
  }> {
    const payments = await this.getUserPayments(studentId, 'student_payment');
    
    let filteredPayments = payments;
    
    if (dateFrom) {
      filteredPayments = filteredPayments.filter(p => p.payment_date >= dateFrom);
    }
    
    if (dateTo) {
      filteredPayments = filteredPayments.filter(p => p.payment_date <= dateTo);
    }

    const completedPayments = filteredPayments.filter(p => p.status === 'completed');
    const pendingPayments = filteredPayments.filter(p => p.status === 'pending');

    return {
      totalPaid: completedPayments.reduce((sum, p) => sum + p.amount, 0),
      pendingPayments: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
      paymentHistory: filteredPayments
    };
  }
};