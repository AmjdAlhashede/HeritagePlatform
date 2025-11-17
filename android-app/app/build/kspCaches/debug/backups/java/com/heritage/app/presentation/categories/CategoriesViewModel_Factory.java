package com.heritage.app.presentation.categories;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation",
    "nullness:initialization.field.uninitialized"
})
public final class CategoriesViewModel_Factory implements Factory<CategoriesViewModel> {
  @Override
  public CategoriesViewModel get() {
    return newInstance();
  }

  public static CategoriesViewModel_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static CategoriesViewModel newInstance() {
    return new CategoriesViewModel();
  }

  private static final class InstanceHolder {
    static final CategoriesViewModel_Factory INSTANCE = new CategoriesViewModel_Factory();
  }
}
