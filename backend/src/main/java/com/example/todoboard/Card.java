package com.example.todoboard;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * タスク（カード）1件を表すクラス。
 * このクラスの1インスタンスが、CARD テーブルの1行（1レコード）に対応する。
 * データ設計（docs/data-design.md）の CARD テーブル定義に合わせている。
 */
@Entity
@Table(name = "card")
public class Card {

    /** カードID（PostgreSQL が自動で振る連番） */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** タイトル（必須） */
    @Column(nullable = false)
    private String title;

    /** メモ・詳細（任意・長文可） */
    @Column(columnDefinition = "TEXT")
    private String memo;

    /** 期限（必須） → DBでは due_date */
    @Column(nullable = false)
    private LocalDate dueDate;

    /** 優先度 high / mid / low（必須） */
    @Column(nullable = false)
    private String priority;

    /** 状態 todo / doing / done（必須） */
    @Column(nullable = false)
    private String status;

    /** リスト内の表示順（必須・小さいほど上） */
    @Column(nullable = false)
    private Integer position;

    /** 作成日時（保存時に自動でセット） → DBでは created_at */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    /** 更新日時（更新時に自動でセット） → DBでは updated_at */
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // --- getter / setter ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMemo() {
        return memo;
    }

    public void setMemo(String memo) {
        this.memo = memo;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
