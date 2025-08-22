-- Flow sistemi için RPC fonksiyonları
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Başlangıç sorusunu getiren fonksiyon
CREATE OR REPLACE FUNCTION get_flow_start_question(p_language_code VARCHAR(5))
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT
        jsonb_build_object(
            'id', q.id,
            'slug', q.slug,
            'text', qt.text,
            'answers', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', a.id,
                        'next_question_id', a.next_question_id,
                        'action_id', a.action_id,
                        'text', at.text
                    )
                )
                FROM public.flow_answers AS a
                JOIN public.flow_answer_translations AS at ON a.id = at.answer_id
                WHERE a.question_id = q.id AND at.language_code = p_language_code
            )
        )
    INTO result
    FROM public.flow_questions AS q
    JOIN public.flow_question_translations AS qt ON q.id = qt.question_id
    WHERE q.is_start_question = TRUE AND qt.language_code = p_language_code
    LIMIT 1;

    RETURN result;
END;
$$;

-- 2. Cevap seçimine göre sonraki adımı getiren fonksiyon
CREATE OR REPLACE FUNCTION get_flow_next_step(p_answer_id BIGINT, p_language_code VARCHAR(5))
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
    next_question_id BIGINT;
    action_id BIGINT;
BEGIN
    -- Cevabın next_question_id veya action_id'sini al
    SELECT a.next_question_id, a.action_id
    INTO next_question_id, action_id
    FROM public.flow_answers AS a
    WHERE a.id = p_answer_id;

    -- Eğer action_id varsa, action'ı döndür
    IF action_id IS NOT NULL THEN
        SELECT
            jsonb_build_object(
                'type', 'action',
                'action', jsonb_build_object(
                    'id', act.id,
                    'action_type', act.action_type,
                    'parameters', act.parameters
                )
            )
        INTO result
        FROM public.flow_actions AS act
        WHERE act.id = action_id;
    -- Eğer next_question_id varsa, sonraki soruyu döndür
    ELSIF next_question_id IS NOT NULL THEN
        SELECT
            jsonb_build_object(
                'type', 'question',
                'question', jsonb_build_object(
                    'id', q.id,
                    'slug', q.slug,
                    'text', qt.text,
                    'answers', (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', a.id,
                                'next_question_id', a.next_question_id,
                                'action_id', a.action_id,
                                'text', at.text
                            )
                        )
                        FROM public.flow_answers AS a
                        JOIN public.flow_answer_translations AS at ON a.id = at.answer_id
                        WHERE a.question_id = q.id AND at.language_code = p_language_code
                    )
                )
            )
        INTO result
        FROM public.flow_questions AS q
        JOIN public.flow_question_translations AS qt ON q.id = qt.question_id
        WHERE q.id = next_question_id AND qt.language_code = p_language_code;
    END IF;

    RETURN result;
END;
$$;

-- 3. Belirli bir soruyu getiren fonksiyon
CREATE OR REPLACE FUNCTION get_flow_question(p_question_id BIGINT, p_language_code VARCHAR(5))
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT
        jsonb_build_object(
            'id', q.id,
            'slug', q.slug,
            'text', qt.text,
            'answers', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', a.id,
                        'next_question_id', a.next_question_id,
                        'action_id', a.action_id,
                        'text', at.text
                    )
                )
                FROM public.flow_answers AS a
                JOIN public.flow_answer_translations AS at ON a.id = at.answer_id
                WHERE a.question_id = q.id AND at.language_code = p_language_code
            )
        )
    INTO result
    FROM public.flow_questions AS q
    JOIN public.flow_question_translations AS qt ON q.id = qt.question_id
    WHERE q.id = p_question_id AND qt.language_code = p_language_code;

    RETURN result;
END;
$$;

-- Fonksiyonları public schema'ya ekle
GRANT EXECUTE ON FUNCTION get_flow_start_question(VARCHAR(5)) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_flow_next_step(BIGINT, VARCHAR(5)) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_flow_question(BIGINT, VARCHAR(5)) TO anon, authenticated;
