import { useState, useMemo } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  TrendingUp, TrendingDown, Wallet, Plus, Search,
  Filter, Trash2, Edit3, X, Check, Download, AlertCircle, ArrowUpRight,
  ArrowDownRight, Receipt, Tag, Calendar, UserCheck, CreditCard
} from 'lucide-react';
import './FinanceAdmin.css';

const INCOME_CATEGORIES = [
  'Team Registration',
  'Sponsorship',
  'Ticket Sales',
  'Stall Vendor',
  'Donations',
  'Merchandise',
  'Other Income'
];

const EXPENSE_CATEGORIES = [
  'Ground & Lighting',
  'Referees & Officials',
  'Trophies & Awards',
  'Medical & First Aid',
  'Sound & Stage',
  'Refreshments',
  'Marketing & Print',
  'Equipment & Balls',
  'Prize Money',
  'Security & Volunteers',
  'Miscellaneous'
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'];

export default function FinanceAdmin() {
  const { finances = [], addFinanceTransaction, updateFinanceTransaction, deleteFinanceTransaction } = useTournament();

  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'income' | 'expense'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    type: 'income',
    title: '',
    amount: '',
    category: 'Team Registration',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
    referenceNo: '',
    paidByOrTo: '',
    notes: '',
  });

  // Calculate totals
  const totalIncome = useMemo(() => {
    return finances
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [finances]);

  const totalExpense = useMemo(() => {
    return finances
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [finances]);

  const netBalance = totalIncome - totalExpense;

  // Category breakdowns for analytics
  const categoryStats = useMemo(() => {
    const incomeCats = {};
    const expenseCats = {};

    finances.forEach(f => {
      const amt = Number(f.amount) || 0;
      if (f.type === 'income') {
        incomeCats[f.category] = (incomeCats[f.category] || 0) + amt;
      } else {
        expenseCats[f.category] = (expenseCats[f.category] || 0) + amt;
      }
    });

    return { incomeCats, expenseCats };
  }, [finances]);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    return finances
      .filter(f => {
        if (typeFilter !== 'all' && f.type !== typeFilter) return false;
        if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = (f.title || '').toLowerCase().includes(q);
          const matchParty = (f.paidByOrTo || '').toLowerCase().includes(q);
          const matchRef = (f.referenceNo || '').toLowerCase().includes(q);
          const matchCat = (f.category || '').toLowerCase().includes(q);
          if (!matchTitle && !matchParty && !matchRef && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'amount-desc') return Number(b.amount) - Number(a.amount);
        if (sortBy === 'amount-asc') return Number(a.amount) - Number(b.amount);
        return 0;
      });
  }, [finances, typeFilter, selectedCategory, searchTerm, sortBy]);

  const handleOpenAdd = (defaultType = 'income') => {
    setEditingId(null);
    setForm({
      type: defaultType,
      title: '',
      amount: '',
      category: defaultType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI',
      referenceNo: '',
      paidByOrTo: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setForm({
      type: item.type,
      title: item.title,
      amount: item.amount,
      category: item.category,
      date: item.date,
      paymentMethod: item.paymentMethod || 'Cash',
      referenceNo: item.referenceNo || '',
      paidByOrTo: item.paidByOrTo || '',
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0) return;

    if (editingId) {
      updateFinanceTransaction(editingId, {
        ...form,
        amount: Number(form.amount),
      });
    } else {
      addFinanceTransaction({
        ...form,
        amount: Number(form.amount),
      });
    }

    setIsModalOpen(false);
  };

  const exportCSV = () => {
    if (finances.length === 0) return;
    const headers = ['ID', 'Type', 'Title', 'Amount (INR)', 'Category', 'Date', 'Payment Method', 'Party', 'Reference No', 'Notes'];
    const rows = finances.map(f => [
      `"${f.id}"`,
      `"${f.type.toUpperCase()}"`,
      `"${f.title.replace(/"/g, '""')}"`,
      f.amount,
      `"${f.category}"`,
      `"${f.date}"`,
      `"${f.paymentMethod || 'Cash'}"`,
      `"${(f.paidByOrTo || '').replace(/"/g, '""')}"`,
      `"${(f.referenceNo || '').replace(/"/g, '""')}"`,
      `"${(f.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pulari_Sevens_Finances_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatINR = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  return (
    <div className="finance-admin">
      {/* ===== 1. SUMMARY KPI CARDS ===== */}
      <div className="finance-kpis">
        {/* Income Card */}
        <div className="finance-kpi-card kpi-income">
          <div className="kpi-header">
            <span className="kpi-label">Total Income</span>
            <div className="kpi-icon-wrap">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">{formatINR(totalIncome)}</div>
          <div className="kpi-sub">
            <span className="kpi-tag-pos">+{finances.filter(f => f.type === 'income').length} entries</span>
            <span>All collections & sponsors</span>
          </div>
        </div>

        {/* Expense Card */}
        <div className="finance-kpi-card kpi-expense">
          <div className="kpi-header">
            <span className="kpi-label">Total Expenses</span>
            <div className="kpi-icon-wrap">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="kpi-value">{formatINR(totalExpense)}</div>
          <div className="kpi-sub">
            <span className="kpi-tag-neg">-{finances.filter(f => f.type === 'expense').length} entries</span>
            <span>Operations & tournament costs</span>
          </div>
        </div>

        {/* Net Profit / Balance Card */}
        <div className={`finance-kpi-card kpi-balance ${netBalance >= 0 ? 'kpi-positive' : 'kpi-negative'}`}>
          <div className="kpi-header">
            <span className="kpi-label">Net Balance / Surplus</span>
            <div className="kpi-icon-wrap">
              <Wallet size={18} />
            </div>
          </div>
          <div className="kpi-value">{formatINR(netBalance)}</div>
          <div className="kpi-sub">
            {netBalance >= 0 ? (
              <span className="kpi-status-badge positive">Surplus Margin: {totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0}%</span>
            ) : (
              <span className="kpi-status-badge negative">Budget Deficit</span>
            )}
          </div>
        </div>
      </div>

      {/* ===== 2. QUICK ACTION BAR & CATEGORY BREAKDOWN ===== */}
      <div className="finance-action-ribbon">
        <div className="ribbon-left">
          <div className="filter-pill-group">
            <button
              className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
              onClick={() => { setTypeFilter('all'); setSelectedCategory('all'); }}
            >
              All ({finances.length})
            </button>
            <button
              className={`filter-btn filter-income ${typeFilter === 'income' ? 'active' : ''}`}
              onClick={() => { setTypeFilter('income'); setSelectedCategory('all'); }}
            >
              <ArrowDownRight size={14} />
              Income ({finances.filter(f => f.type === 'income').length})
            </button>
            <button
              className={`filter-btn filter-expense ${typeFilter === 'expense' ? 'active' : ''}`}
              onClick={() => { setTypeFilter('expense'); setSelectedCategory('all'); }}
            >
              <ArrowUpRight size={14} />
              Expenses ({finances.filter(f => f.type === 'expense').length})
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="category-select-wrap">
            <Filter size={14} className="cat-icon" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="cat-select"
            >
              <option value="all">All Categories</option>
              {typeFilter !== 'expense' && (
                <optgroup label="Income Categories">
                  {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              )}
              {typeFilter !== 'income' && (
                <optgroup label="Expense Categories">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        <div className="ribbon-right">
          <button className="btn btn-outline" onClick={exportCSV} title="Download CSV report">
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenAdd('income')}>
            <Plus size={15} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* ===== 3. SEARCH & SORT BAR ===== */}
      <div className="finance-search-bar">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search by title, party/payer, reference no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="sort-select-wrap">
          <span className="sort-label">Sort by:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date-desc">Date (Newest first)</option>
            <option value="date-asc">Date (Oldest first)</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="amount-asc">Amount (Low to High)</option>
          </select>
        </div>
      </div>

      {/* ===== 4. TRANSACTIONS LEDGER TABLE ===== */}
      <div className="finance-table-container">
        {filteredTransactions.length === 0 ? (
          <div className="finance-empty-state">
            <Receipt size={40} />
            <h4>No financial transactions found</h4>
            <p>Try clearing your search or add a new transaction above.</p>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenAdd('income')}>
              <Plus size={14} />
              Add First Transaction
            </button>
          </div>
        ) : (
          <table className="finance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title / Description</th>
                <th>Category</th>
                <th>Party / Payer</th>
                <th>Method</th>
                <th className="th-amount">Amount</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className={`tx-row tx-${tx.type}`}>
                  <td className="td-date">
                    <div className="date-badge">
                      <Calendar size={12} />
                      <span>{tx.date}</span>
                    </div>
                  </td>
                  <td className="td-title">
                    <div className="tx-title-main">{tx.title}</div>
                    {tx.referenceNo && (
                      <div className="tx-ref">Ref: {tx.referenceNo}</div>
                    )}
                    {tx.notes && (
                      <div className="tx-notes">{tx.notes}</div>
                    )}
                  </td>
                  <td className="td-category">
                    <span className="cat-pill">
                      <Tag size={11} />
                      {tx.category}
                    </span>
                  </td>
                  <td className="td-party">
                    {tx.paidByOrTo ? (
                      <div className="party-name">
                        <UserCheck size={12} />
                        <span>{tx.paidByOrTo}</span>
                      </div>
                    ) : (
                      <span className="party-empty">—</span>
                    )}
                  </td>
                  <td className="td-method">
                    <span className="method-pill">
                      <CreditCard size={11} />
                      {tx.paymentMethod || 'Cash'}
                    </span>
                  </td>
                  <td className="td-amount">
                    <div className={`amount-value ${tx.type === 'income' ? 'income-val' : 'expense-val'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount)}
                    </div>
                  </td>
                  <td className="td-actions">
                    <div className="action-buttons-group">
                      <button
                        className="btn-icon-sm"
                        onClick={() => handleOpenEdit(tx)}
                        title="Edit transaction"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="btn-icon-sm btn-icon-danger"
                        onClick={() => setDeleteConfirmId(tx.id)}
                        title="Delete transaction"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== 5. ADD / EDIT TRANSACTION MODAL ===== */}
      {isModalOpen && (
        <div className="finance-modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="finance-modal animate-scale">
            <div className="finance-modal-header">
              <div className="modal-title-wrap">
                <Receipt size={18} />
                <h3>{editingId ? 'Edit Transaction' : 'Record New Transaction'}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="finance-form">
              {/* Type Switcher */}
              <div className="form-type-toggle">
                <button
                  type="button"
                  className={`type-btn ${form.type === 'income' ? 'type-btn--income-active' : ''}`}
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      type: 'income',
                      category: INCOME_CATEGORIES.includes(prev.category) ? prev.category : INCOME_CATEGORIES[0]
                    }));
                  }}
                >
                  <TrendingUp size={16} />
                  Income / Collection
                </button>
                <button
                  type="button"
                  className={`type-btn ${form.type === 'expense' ? 'type-btn--expense-active' : ''}`}
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      type: 'expense',
                      category: EXPENSE_CATEGORIES.includes(prev.category) ? prev.category : EXPENSE_CATEGORIES[0]
                    }));
                  }}
                >
                  <TrendingDown size={16} />
                  Expense / Payout
                </button>
              </div>

              {/* Title / Description */}
              <div className="form-group">
                <label>Transaction Title *</label>
                <input
                  type="text"
                  required
                  placeholder={form.type === 'income' ? 'e.g. Malabar Gold Title Sponsorship' : 'e.g. EMS Stadium Floodlights & Ground Rent'}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Amount & Date Grid */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Amount (₹ INR) *</label>
                  <div className="amount-input-wrap">
                    <span className="currency-prefix">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Category & Payment Method */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Mode</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Paid by / Paid to & Reference */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label>{form.type === 'income' ? 'Received From (Payer)' : 'Paid To (Payee / Vendor)'}</label>
                  <input
                    type="text"
                    placeholder={form.type === 'income' ? 'e.g. Club Real Madrid' : 'e.g. Kozhikode Referees Council'}
                    value={form.paidByOrTo}
                    onChange={(e) => setForm({ ...form, paidByOrTo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Reference No. / UTR / Receipt</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/2026/89128 or RCP-101"
                    value={form.referenceNo}
                    onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label>Notes / Memo</label>
                <textarea
                  rows="2"
                  placeholder="Additional details regarding this entry..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {/* Modal Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  <span>{editingId ? 'Update Entry' : 'Record Transaction'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== 6. CONFIRM DELETE DIALOG ===== */}
      {deleteConfirmId && (
        <div className="finance-modal-overlay" style={{ zIndex: 10001 }}>
          <div className="finance-confirm-modal animate-scale">
            <div className="confirm-icon-wrap">
              <AlertCircle size={24} />
            </div>
            <h4>Delete this financial entry?</h4>
            <p>This entry will be permanently removed from the ledger and synced with your Neon database.</p>
            <div className="confirm-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  deleteFinanceTransaction(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
              >
                <Trash2 size={14} />
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
