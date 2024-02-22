/****** Object:  StoredProcedure [apidata].[Get_AppRegistration_By_ClientId]   */

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER   PROCEDURE [apidata].[Get_AppRegistration_By_ClientId] (
  @ClientId NVARCHAR(50)
) as
BEGIN
  SET NOCOUNT ON
  
  SELECT ar.*
  FROM apidata.AppRegistration ar
  WHERE ar.ClientId = @ClientId
  	
END

