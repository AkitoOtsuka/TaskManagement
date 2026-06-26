package com.example.todoboard;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * CARD テーブルを操作するための入り口。
 * JpaRepository を継承するだけで、保存・取得・削除などの基本的なDB操作が
 * Spring Data によって自動的に提供される（自分でSQLを書く必要がない）。
 *
 * 型パラメータ：
 *   - Card … 扱う Entity（どのテーブルか）
 *   - Long … 主キー（id）の型。Card クラスの id フィールドの型と一致させる
 */
public interface CardRepository extends JpaRepository<Card, Long> {
}
