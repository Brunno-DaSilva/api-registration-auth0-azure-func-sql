/****** Object:  StoredProcedure [apidata].[Get_ListOfFields_By_CustomerCode]  ******/

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER   PROCEDURE [apidata].[Get_ListOfFields_By_CustomerCode] (
  @CustomerCode NVARCHAR(100)
) as
BEGIN
  SET NOCOUNT ON

  -- Update the variable if ClientId is sent as parameter
  SELECT @CustomerCode = CustomerCode FROM apidata.AppRegistration WHERE ClientId = @CustomerCode

  SELECT lcf.FieldSource, lcf.FieldName, lcf.FieldLabel
    , ROW_NUMBER() OVER(ORDER BY isnull(lcf.Sort, 1000), lcf.FieldName) AS Sort
  FROM apidata.ListOfFields lcf
  UNION
  SELECT ef.EntityName + ' Custom', ef.FieldName, COALESCE(efc.Label, ef.Label)
    , 1000 + ROW_NUMBER() OVER(ORDER BY ISNULL(COALESCE(efc.Sort, ef.Sort), 1000), ef.FieldName) as Sort
  FROM db.EntityField ef
  left join db.EntityFieldCustomer efc ON ef.EntityFieldCode = efc.EntityFieldCode and efc.CustomerCode = @CustomerCode
  WHERE (ef.CustomerCode = @CustomerCode or (ef.CustomerCode is null and ef.FieldType = 'Global'))
    AND COALESCE(efc.Hidden, ef.Hidden, 1) = 0
    AND COALESCE(efc.IsInternal, ef.IsInternal, 1) = 0
    AND ef.EntityName IN ('Asset','Contract','Location')
  ORDER BY Sort

END
