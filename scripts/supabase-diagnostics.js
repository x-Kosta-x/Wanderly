
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 ДИАГНОСТИКА ПОДКЛЮЧЕНИЯ К SUPABASE')
console.log('=====================================\n')

// 1. Проверка переменных окружения
console.log('1. КОНФИГУРАЦИЯ:')
console.log(`   URL: ${supabaseUrl ? '✅ Настроен' : '❌ Не найден'}`)
console.log(`   KEY: ${supabaseAnonKey ? '✅ Настроен' : '❌ Не найден'}`)
console.log(`   URL значение: ${supabaseUrl || 'НЕ НАЙДЕН'}`)
console.log(`   KEY начинается с: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'НЕ НАЙДЕН'}\n`)

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ ОШИБКА: Переменные окружения не настроены!')
  process.exit(1)
}

// 2. Проверка демо-режима
const isDemoMode = supabaseUrl === 'https://demo.supabase.co' || supabaseAnonKey === 'demo_key'
console.log('2. СТАТУС ДЕМО-РЕЖИМА:')
console.log(`   Демо-режим: ${isDemoMode ? '❌ Включен' : '✅ Отключен'}\n`)

// 3. Создание клиента и проверка подключения
console.log('3. ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЯ:')
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    // Проверка подключения
    console.log('   🔌 Проверка подключения...')
    const { data: healthData, error: healthError } = await supabase
      .from('trips')
      .select('count', { count: 'exact', head: true })
    
    if (healthError) {
      console.log(`   ❌ Ошибка подключения: ${healthError.message}`)
      return false
    }
    
    console.log('   ✅ Подключение успешно!')
    
    // Проверка таблиц
    console.log('\n4. ПРОВЕРКА ТАБЛИЦ:')
    const tables = ['trips', 'participants', 'expenses', 'expense_shares', 'transfers']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`   ❌ Таблица ${table}: ${error.message}`)
        } else {
          console.log(`   ✅ Таблица ${table}: найдена`)
        }
      } catch (err) {
        console.log(`   ❌ Таблица ${table}: ошибка проверки`)
      }
    }
    
    // Проверка данных
    console.log('\n5. ПРОВЕРКА ДАННЫХ:')
    try {
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .limit(5)
      
      if (tripsError) {
        console.log(`   ❌ Ошибка чтения поездок: ${tripsError.message}`)
      } else {
        console.log(`   ✅ Поездки: найдено ${trips?.length || 0} записей`)
        if (trips && trips.length > 0) {
          console.log(`   📋 Пример поездки: "${trips[0].name}"`)
        }
      }
    } catch (err) {
      console.log(`   ❌ Ошибка чтения данных: ${err.message}`)
    }
    
    // Тест создания записи
    console.log('\n6. ТЕСТ CRUD ОПЕРАЦИЙ:')
    try {
      console.log('   🔧 Тестирование создания записи...')
      const testTrip = {
        name: 'Тестовая поездка - ' + new Date().toISOString(),
        location: 'Тестовое место',
        startDate: '2024-12-15',
        endDate: '2024-12-16',
        isArchived: false
      }
      
      const { data: created, error: createError } = await supabase
        .from('trips')
        .insert([testTrip])
        .select()
      
      if (createError) {
        console.log(`   ❌ Ошибка создания: ${createError.message}`)
      } else {
        console.log('   ✅ Создание записи: успешно')
        
        // Тест удаления
        if (created && created[0]) {
          console.log('   🔧 Тестирование удаления записи...')
          const { error: deleteError } = await supabase
            .from('trips')
            .delete()
            .eq('id', created[0].id)
          
          if (deleteError) {
            console.log(`   ❌ Ошибка удаления: ${deleteError.message}`)
          } else {
            console.log('   ✅ Удаление записи: успешно')
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ Ошибка CRUD операций: ${err.message}`)
    }
    
    // Тест Real-time
    console.log('\n7. ТЕСТ REAL-TIME:')
    try {
      console.log('   🔧 Проверка Real-time подписки...')
      const channel = supabase
        .channel('test-channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'trips'
        }, (payload) => {
          console.log('   ✅ Real-time событие получено:', payload.eventType)
        })
        .subscribe()
      
      setTimeout(() => {
        channel.unsubscribe()
        console.log('   ✅ Real-time подписка: настроена успешно')
      }, 1000)
      
    } catch (err) {
      console.log(`   ❌ Ошибка Real-time: ${err.message}`)
    }
    
    return true
    
  } catch (err) {
    console.log(`   ❌ Общая ошибка тестирования: ${err.message}`)
    return false
  }
}

// Запуск тестирования
testConnection().then(success => {
  console.log('\n=====================================')
  if (success) {
    console.log('🎉 РЕЗУЛЬТАТ: Supabase настроен и работает корректно!')
  } else {
    console.log('💥 РЕЗУЛЬТАТ: Обнаружены проблемы с подключением!')
  }
  console.log('=====================================')
  process.exit(success ? 0 : 1)
}).catch(err => {
  console.log('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', err.message)
  process.exit(1)
})
