
-- Создание таблиц для приложения учёта расходов в поездках

-- Таблица поездок
CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    location TEXT,
    "startDate" TIMESTAMPTZ,
    "endDate" TIMESTAMPTZ,
    "isArchived" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица участников
CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    "tripId" TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE
);

-- Таблица расходов
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'RUB',
    date TIMESTAMPTZ DEFAULT NOW(),
    "payerId" TEXT NOT NULL REFERENCES participants(id),
    "tripId" TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица долей расходов
CREATE TABLE IF NOT EXISTS expense_shares (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "expenseId" TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    "participantId" TEXT NOT NULL REFERENCES participants(id),
    amount DECIMAL(10, 2) NOT NULL,
    UNIQUE("expenseId", "participantId")
);

-- Таблица переводов
CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'RUB',
    description TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    "fromId" TEXT NOT NULL REFERENCES participants(id),
    "toId" TEXT NOT NULL REFERENCES participants(id),
    "tripId" TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Функция для обновления updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updatedAt в таблице trips
DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Включение Row Level Security (RLS) для всех таблиц
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Политики доступа (разрешаем всем операции для демо-версии)
-- В продакшене здесь должны быть более строгие правила

-- Политики для trips
DROP POLICY IF EXISTS "Allow all operations on trips" ON trips;
CREATE POLICY "Allow all operations on trips" ON trips
    FOR ALL USING (true) WITH CHECK (true);

-- Политики для participants
DROP POLICY IF EXISTS "Allow all operations on participants" ON participants;
CREATE POLICY "Allow all operations on participants" ON participants
    FOR ALL USING (true) WITH CHECK (true);

-- Политики для expenses
DROP POLICY IF EXISTS "Allow all operations on expenses" ON expenses;
CREATE POLICY "Allow all operations on expenses" ON expenses
    FOR ALL USING (true) WITH CHECK (true);

-- Политики для expense_shares
DROP POLICY IF EXISTS "Allow all operations on expense_shares" ON expense_shares;
CREATE POLICY "Allow all operations on expense_shares" ON expense_shares
    FOR ALL USING (true) WITH CHECK (true);

-- Политики для transfers
DROP POLICY IF EXISTS "Allow all operations on transfers" ON transfers;
CREATE POLICY "Allow all operations on transfers" ON transfers
    FOR ALL USING (true) WITH CHECK (true);

-- Включение realtime для всех таблиц
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE expense_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE transfers;

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_participants_trip_id ON participants("tripId");
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses("tripId");
CREATE INDEX IF NOT EXISTS idx_expenses_payer_id ON expenses("payerId");
CREATE INDEX IF NOT EXISTS idx_expense_shares_expense_id ON expense_shares("expenseId");
CREATE INDEX IF NOT EXISTS idx_expense_shares_participant_id ON expense_shares("participantId");
CREATE INDEX IF NOT EXISTS idx_transfers_trip_id ON transfers("tripId");
CREATE INDEX IF NOT EXISTS idx_transfers_from_id ON transfers("fromId");
CREATE INDEX IF NOT EXISTS idx_transfers_to_id ON transfers("toId");
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips("createdAt");
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(date);
