-- Migration: 0015_create_sales_and_sale_items.sql
-- Tabela de Vendas
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  sale_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO', 'A_PRAZO')),
  total_amount REAL NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Tabela de Itens de Venda
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_sales_appointment_id ON sales(appointment_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Trigger para decrementar estoque de produto automaticamente após venda
CREATE TRIGGER IF NOT EXISTS update_stock_on_sale_item_insert
AFTER INSERT ON sale_items
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity,
      updated_at = datetime('now', 'localtime')
  WHERE id = NEW.product_id;
END;
