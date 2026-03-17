import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: expenses, error } = await supabase
        .from('credit_card_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map snake_case from DB to camelCase for frontend
    const mappedExpenses = expenses.map(expense => ({
        id: expense.id,
        user_id: expense.user_id,
        date: expense.date,
        description: expense.description,
        totalAmount: expense.total_amount,
        installments: expense.installments,
        currentInstallment: expense.current_installment,
        bankName: expense.bank_name,
        category: expense.category,
        paid: expense.paid,
        created_at: expense.created_at,
        updated_at: expense.updated_at
    }))

    return NextResponse.json(mappedExpenses)
}

export async function POST(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Map camelCase from frontend to snake_case for DB
    const dbPayload = {
        user_id: user.id,
        date: body.date,
        description: body.description,
        total_amount: body.totalAmount,
        installments: body.installments,
        current_installment: body.currentInstallment,
        bank_name: body.bankName,
        category: body.category,
        paid: body.paid || false
    }

    const { data, error } = await supabase
        .from('credit_card_expenses')
        .insert([dbPayload])
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map back to camelCase for response
    const mappedResponse = {
        id: data.id,
        user_id: data.user_id,
        date: data.date,
        description: data.description,
        totalAmount: data.total_amount,
        installments: data.installments,
        currentInstallment: data.current_installment,
        bankName: data.bank_name,
        category: data.category,
        paid: data.paid,
        created_at: data.created_at,
        updated_at: data.updated_at
    }

    return NextResponse.json(mappedResponse)
}

export async function PUT(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    // Map camelCase to snake_case for update
    const dbPayload: any = {}
    if (updateData.date !== undefined) dbPayload.date = updateData.date
    if (updateData.description !== undefined) dbPayload.description = updateData.description
    if (updateData.totalAmount !== undefined) dbPayload.total_amount = updateData.totalAmount
    if (updateData.installments !== undefined) dbPayload.installments = updateData.installments
    if (updateData.currentInstallment !== undefined) dbPayload.current_installment = updateData.currentInstallment
    if (updateData.bankName !== undefined) dbPayload.bank_name = updateData.bankName
    if (updateData.category !== undefined) dbPayload.category = updateData.category
    if (updateData.paid !== undefined) dbPayload.paid = updateData.paid

    const { data, error } = await supabase
        .from('credit_card_expenses')
        .update(dbPayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map back to camelCase
    const mappedResponse = {
        id: data.id,
        user_id: data.user_id,
        date: data.date,
        description: data.description,
        totalAmount: data.total_amount,
        installments: data.installments,
        currentInstallment: data.current_installment,
        bankName: data.bank_name,
        category: data.category,
        paid: data.paid,
        created_at: data.created_at,
        updated_at: data.updated_at
    }

    return NextResponse.json(mappedResponse)
}

export async function DELETE(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabase
        .from('credit_card_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
